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

interface CreateRefBody {
  evmAddress: string
}

interface VerifyRefBody {
  signature: string
  evmAddress: string
  code: string
}

export const createRef = async (req: Request, res: Response) => {
  try {
    let body: CreateRefBody = req.body
    let { evmAddress } = body

    const user = await findUser({ evmAddress: evmAddress.toLocaleLowerCase() })

    if (user?.code) {
      res.status(500).json({ error: 'Address was used' })
    } else {
      const response = await axios.get(
        `${process.env.MARKETPLACE_ENDPOINT_API}/stake-info/${evmAddress}`
      )
      const data: {
        totalBtcStaked: string
        validCoreStaked: string
        validCoreWithdrawn: string
      } = response.data

      const web3 = new Web3(RPC_URL)
      const dualCore = new web3.eth.Contract(dualCoreAbi, DUAL_CORE_ADDRESS)
      const coreVault = new web3.eth.Contract(coreVaultAbi, VAULT_ADDRESS)
      const userDualCoreBalance = await dualCore.methods
        .balanceOf(evmAddress)
        .call()
      const coreStakedToVault = (await coreVault.methods
        .exchangeCore(userDualCoreBalance)
        .call()) as unknown as bigint

      if (
        BigInt(data.totalBtcStaked) < BigInt(1e7) &&
        BigInt(data.validCoreStaked) +
          coreStakedToVault -
          BigInt(data.validCoreWithdrawn)
      ) {
      }

      const doc = await createUser({
        evmAddress: evmAddress.toLocaleLowerCase(),
        code: crypto
          .createHash('md5')
          .update(evmAddress.toLocaleLowerCase())
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

    const isExistUser = await findUser({ evmAddress: address })

    return res.status(200).json({
      text: isExistUser ? 'Address was signed' : `Address wasn't signed`,
      isSigned: isExistUser,
    })
  } catch (error) {
    res.status(500).json({ error: error.message || error })
  }
}
