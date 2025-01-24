import { Request, Response } from 'express'
import Web3 from 'web3'
import {
  countHolder,
  findMarketplaceStakers,
  findRecordsWithPagination,
  findReferral,
  getHolders,
  getPointLeaderboard,
  getSnapshotRecords,
} from '../services'
import { Snapshot } from '../models'

export const getTotalPoint = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!Web3.utils.isAddress(req.params.holder)) {
      res.status(400).json({ error: 'holder is invalid address' })
      return
    }
    const holder = Web3.utils.toChecksumAddress(req.params.holder)

    let addressInfo

    const records = await getSnapshotRecords()
    const refRecord = await findReferral({ to: holder })

    const totalDocument = await countHolder()

    const addressData = records
      .map((record, idx) => {
        if (Web3.utils.toChecksumAddress(record['_id']) === holder) {
          return {
            totalPoint: record['totalPoints'],
            rank: idx + 1,
            holder: record['_id'],
          }
        }
      })
      .filter((el) => el != undefined)

    addressInfo = addressData.length
      ? addressData[0]
      : {
          holder,
          rank: totalDocument.length ? totalDocument[0]['totalHolders'] + 1 : 0,
          totalPoint: 0,
        }

    addressInfo.refferFrom = refRecord ? refRecord['from'] : undefined
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
    const type = req.query.type as string
    const isBtcClaim = req.query.isBtcClaim === 'true'
    const query = type
      ? {
          holder: { $regex: `^${req.params.holder}$`, $options: 'i' },
          type: {
            $eq: type,
            ...(type === 'marketplace-claim-reward' && {
            isBtcClaim: { $eq: isBtcClaim },
          }),
        }}
      : {
          holder: { $regex: `^${req.params.holder}$`, $options: 'i' },
        }

    if (!Web3.utils.isAddress(req.params.holder)) {
      res.status(400).json({ error: 'holder is invalid address' })
      return
    }

    const result = await findRecordsWithPagination(
      {
        ...query,
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
