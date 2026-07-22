import { Request, Response } from 'express'
import Web3 from 'web3'
import {
  countHolder,
  countUserPoint,
  findRecordsWithPagination,
  findReferral,
  findTotalPoint,
  getEarnTodayRequest,
  getUserPointLeaderboard,
} from '../services'

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
    if (!Web3.utils.isAddress(req.params.holder)) {
      res.status(400).json({ error: 'holder is invalid address' })
      return
    }

    const type = req.query.type as string
    const isBtcClaim = req.query.isBtcClaim === 'true'
    const query = type
      ? {
        holder: req.params.holder.toLowerCase(),
        type: { $eq: type },
        ...(type === 'marketplace-claim-reward' && {
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

    const [totalDocument, docs] = await Promise.all([
      countUserPoint(),
      getUserPointLeaderboard(page, limit),
    ])

    const totalPage = Math.ceil(totalDocument ? totalDocument / limit : 1)

    const data = docs.map((el) => ({
      holder: Web3.utils.toChecksumAddress(el.holder),
      totalPoint: el.totalPoint,
      refferFrom: el.refferFrom,
      from: el.refferFrom ? [el.refferFrom] : [],
    }))

    const lastUpdate = docs.length ? docs[0].lastUpdate : null

    res.status(200).json({
      totalDocument: totalDocument ? totalDocument : 0,
      totalPage: totalPage,
      page: page,
      data,
      lastUpdate,
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
