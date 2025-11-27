import { Request, Response } from 'express'
import Web3 from 'web3'
import {
  countHolder,
  findMarketplaceStakers,
  findRecordsWithPagination,
  findReferral,
  findTotalPoint,
  findTotalPointWithEvmAndBabylon,
  getEarnTodayRequest,
  getHolders,
  getPointLeaderboard,
} from '../services'

export const getTotalPoint = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.params.holder) {
      res.status(400).json({ error: 'holder query is missing' })
      return
    }
    if (
      !req.params.holder.startsWith('bbn') &&
      !Web3.utils.isAddress(req.params.holder)
    ) {
      res.status(400).json({ error: 'holder is invalid address' })
      return
    }

    const holder = req.params.holder

    let addressInfo
    const record = await findTotalPoint(holder.toLowerCase())
    const refRecord = await findReferral({ to: holder })
    if (record.length) {
      addressInfo = record[0]
    } else {
      const totalDocument = await countHolder()
      addressInfo = {
        holder,
        rank: totalDocument.length ? totalDocument[0]['totalHolders'] + 1 : 0,
        totalPoint: 0,
      }
    }
    addressInfo.refferFrom = refRecord ? refRecord['from'] : undefined
    res.status(200).json(addressInfo)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message || error })
  }
}

export const getTotalPointV2 = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: {
      evmAddress?: string
      babylonAddress?: string
    } = req.body
    let { evmAddress, babylonAddress } = body

    if (!evmAddress && !babylonAddress) {
      res.status(400).json({
        error:
          'Require at least 1 field evmAddress or babylonAddress in request body',
      })
      return
    }
    if (babylonAddress && !babylonAddress.startsWith('bbn')) {
      res.status(400).json({ error: 'babylonAddress is invalid address' })
      return
    }

    if (evmAddress && !Web3.utils.isAddress(evmAddress)) {
      res.status(400).json({ error: 'evmAddress is invalid address' })
      return
    }

    let addressInfo: {
      holder?: string
      evmPoint?: number
      babylonPoint?: number
      totalPoint?: number
      rank: number
      refferFrom?: string | undefined
    } = {
      evmPoint: 0,
      babylonPoint: 0,
      totalPoint: 0,
      rank: 0,
      refferFrom: undefined,
    }
    if (evmAddress) {
      evmAddress = evmAddress.toLowerCase()
      const refRecord = await findReferral({ to: evmAddress })
      addressInfo.refferFrom = refRecord ? refRecord['from'] : undefined
    }
    const record = await findTotalPointWithEvmAndBabylon({
      evmAddress,
      babylonAddress,
    })
    if (record.length) {
      addressInfo = record[0]
    } else {
      const totalDocument = await countHolder()
      addressInfo = {
        holder: evmAddress,
        rank: totalDocument.length ? totalDocument[0]['totalHolders'] + 1 : 0,
        totalPoint: 0,
      }
    }
    res.status(200).json(addressInfo)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message || error })
  }
}

export const getHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = 10
    if (isNaN(page) || page < 1) {
      res.status(400).send({ error: 'Invalid page number' })
      return
    }
    if (!req.params.holder) {
      res.status(400).json({ error: 'holder query is missing' })
      return
    }
    if (
      !req.params.holder.startsWith('bbn') &&
      !Web3.utils.isAddress(req.params.holder)
    ) {
      res.status(400).json({ error: 'holder is invalid address' })
      return
    }

    const type = req.query.type as string
    const isBtcClaim = req.query.isBtcClaim === 'true'
    const query = type
      ? {
          holder: req.params.holder.toLowerCase(),
          type: { $eq: type },
          ...((type === 'marketplace-claim-reward' ||
            type === 'babylon-marketplace') && {
            isBtcClaim: { $eq: isBtcClaim },
          }),
        }
      : {
          holder: req.params.holder.toLowerCase(),
        }

    const result = await findRecordsWithPagination(
      {
        ...query,
        point: {$gte: 0.01}
      },
      {
        sortBy: 'createdAt:desc',
        page,
        limit,
      }
    )

    res.status(200).json({
      holder: req.params.holder,
      ...result,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message || error })
  }
}

export const getLeaderboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = 10
    if (isNaN(page) || page < 1) {
      res.status(400).send({ error: 'Invalid page number' })
      return
    }
    const snapshotHolders = await getHolders()

    const marketplaceStakers = await findMarketplaceStakers()
    const users = Array.from(
      new Set([
        ...snapshotHolders.map((holder) =>
          Web3.utils.toChecksumAddress(holder)
        ),
        ...marketplaceStakers.map((staker) =>
          Web3.utils.toChecksumAddress(staker)
        ),
      ])
    )
    const totalDocument = users.length
    const totalPage = Math.ceil(totalDocument ? totalDocument / limit : 1)
    const skip = (page - 1) * limit

    let result = (await getPointLeaderboard(page, limit)) as Array<{
      totalPoint: number
      holder: string
      from: Array<string>
    }>

    result = result.map((el) => {
      // @ts-ignore
      el.refferFrom = el.from.length ? el.from[0] : undefined
      return el
    })
    if (skip < users.length && result.length < 10) {
      const to = skip + (10 - result.length)
      for (let i = skip; i <= to; i++) {
        if (users[i]) {
          result.push({
            totalPoint: 0,
            from: [],
            holder: users[i],
          })
        }
      }
    }

    res.status(200).json({
      totalDocument: totalDocument ? totalDocument : 0,
      totalPage: totalPage,
      page: page,
      data: result,
      lastUpdate: new Date(),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message || error })
  }
}


export const getEarnToday = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const earn = await getEarnTodayRequest(req.params.address)
    const point = earn.length ? earn[0].totalPoint: 0
    res.json({point: point})
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message || error })
  }
}
