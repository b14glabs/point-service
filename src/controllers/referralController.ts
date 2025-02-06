import { Request, Response } from 'express'
import axios from 'axios'
import Web3 from 'web3'
import * as crypto from 'crypto'
import * as sigUtil from '@metamask/eth-sig-util'
import dualCoreAbi from '../abi/dual-core.json'
import coreVaultAbi from '../abi/coreVault.json'
import { User } from '../models/user.model'
import { DUAL_CORE_ADDRESS, RPC_URL, VAULT_ADDRESS } from '../const'
import { createUser, findUser } from '../services/user.service'
import { createReferral, findReferral } from '../services'
import { Referral } from '../models'

interface CreateRefBody {
  evmAddress: string
}

interface VerifyRefBody {
  signature: string
  evmAddress: string
  code: string
}

const web3 = new Web3(RPC_URL)

export const createRef = async (req: Request, res: Response) => {
  try {
    let body: CreateRefBody = req.body
    let { evmAddress } = body

    if (!web3.utils.isAddress(evmAddress)) {
      return res.status(400).json({ error: 'evmAddress address required' })
    }

    const user = await findUser({ evmAddress: evmAddress.toLowerCase() })

    if (user?.code) {
      res.status(400).json({ error: 'Address was used' })
    } else {
      const web3 = new Web3(RPC_URL)
      const dualCore = new web3.eth.Contract(dualCoreAbi, DUAL_CORE_ADDRESS)
      const coreVault = new web3.eth.Contract(coreVaultAbi, VAULT_ADDRESS)
      const [response, userDualCoreBalance] = await Promise.all([
        axios.get(
          `${process.env.MARKETPLACE_ENDPOINT_API}/stake-info/${evmAddress}`
        ), 
        dualCore.methods
          .balanceOf(evmAddress)
          .call()
      ])
      const data: {
        totalBtcStaked: string
        validCoreStaked: string
        validCoreWithdrawn: string
      } = response.data
      const coreStakedToVault = (await coreVault.methods
        .exchangeCore(userDualCoreBalance)
        .call()) as unknown as bigint

      if (
        BigInt(data.totalBtcStaked) < BigInt(1e7) &&
        BigInt(data.validCoreStaked) +
        coreStakedToVault -
        BigInt(data.validCoreWithdrawn) <
        BigInt(1000 * 1e18)
      ) {
        return res.status(400).json({
          message:
            'You must stake min 0.1 BTC or current stake more than 1000 CORE',
        })
      }

      const doc = await createUser({
        evmAddress: evmAddress.toLowerCase(),
        code: crypto
          .createHash('md5')
          .update(evmAddress.toLowerCase())
          .digest()
          .toString('hex'),
      })

      return res.status(200).json(doc)
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message || error })
  }
}

export const verifyRef = async (req: Request, res: Response) => {
  try {
    let body: VerifyRefBody = req.body
    const { signature: sig, evmAddress, code } = body
    if (!sig || !evmAddress || !code) {
      return res.status(400).json({
        error: 'Invalid body',
      })
    }

    const text = `I'm joining B14G with address ${evmAddress} by referral code ${code}`
    const recoveredAddress = sigUtil.recoverPersonalSignature({
      data: Buffer.from(text),
      signature: sig,
    })

    if (recoveredAddress !== evmAddress.toLowerCase()) {
      return res.status(500).json({ error: 'Invalid signature' })
    }

    const user = await findUser({ code })

    if (!user) {
      return res.status(500).json({ error: 'Refferal code not found' })
    }

    if (user.evmAddress.toLowerCase() === evmAddress.toLowerCase()) {
      return res.status(500).json({ error: 'Self referred' })
    }

    const existRef = await findReferral({
      to: evmAddress.toLowerCase(),
    })

    if (existRef) {
      return res.status(500).json({ error: 'Already referred' })
    }

    await createReferral({
      from: user.evmAddress,
      to: evmAddress.toLowerCase(),
    })

    const existUser = await findUser({ evmAddress: evmAddress.toLowerCase() })
    if (!existUser) {
      await createUser({
        evmAddress: evmAddress.toLowerCase(),
      })
    }
    return res.status(200).json({ message: 'Verify referral code complete!' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message || error })
  }
}

export const getCheckAddress = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const address = String(req.query.address).toLowerCase()
    const [isExistUser, totalRefer] = await Promise.all([
      findUser({ evmAddress: address }),
      Referral.countDocuments({
        from: address,
      })
    ])
    return res.status(200).json({
      text: isExistUser ? 'Address was signed' : `Address wasn't signed`,
      isSigned: isExistUser,
      totalRefer
    })
  } catch (error) {
    res.status(500).json({ error: error.message || error })
  }
}

export const getReferInfo = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    if (!web3.utils.isAddress(req.query.address as string)) {
      return res.status(400).json({ error: 'address is required' })
    }
    const address = String(req.query.address).toLowerCase()
    const referBy = await Referral.findOne({to: address})
    return res.status(200).json({referBy: referBy ? referBy.from : null})
  } catch (error) {
    res.status(500).json({ error: error.message || error })
  }
}

