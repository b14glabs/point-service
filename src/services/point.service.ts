import { RootFilterQuery } from 'mongoose'
import { IPoint, Point } from '../models'
import { findReferrals } from './referral.service'
import { TYPE } from '../const'

const createPoint = (data: IPoint[]) => {
  return Point.insertMany(data, { ordered: false })
}

export const getPointRecords = () => {
  return Point.aggregate<{ _id: string; totalPoints: number }>([
    {
      $group: {
        _id: '$holder',
        totalPoints: { $sum: '$point' },
      },
    },
    {
      $sort: {
        totalPoints: -1,
      },
    },
  ])
}

export const findPoint = (filter: RootFilterQuery<IPoint>) => {
  return Point.findOne(filter)
}

export const getHolders = () => {
  return Point.distinct("holder")
}

export const countHolder = () => {
  return Point.aggregate<{ totalHolders: number }>([
    {
      $group: { _id: '$holder' },
    },
    {
      $count: 'totalHolders',
    },
  ])
}

export const countRecordsByHolder = (holder: string) => {
  return Point.countDocuments({ holder })
}

export const findRecordsWithPagination = (
  filter: RootFilterQuery<IPoint>,
  options: any
) => {
  return (Point as any).paginate(filter, options)
}

export const getPointLeaderboard = (page: number, limit: number) => {
  return Point.aggregate([
    {
      $group: {
        _id: '$holder',
        totalPoint: { $sum: '$point' },
      },
    },
    {
      $project: {
        _id: 0,
        holder: '$_id',
        totalPoint: 1,
      },
    },
    {
      $sort: { totalPoint: -1 },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: 'referrals', // The name of the second collection
        localField: 'holder', // Field from the aggregation result
        foreignField: 'to', // Field in the second collection
        as: 'holderDetails', // Name of the array field to output
      },
    },

    {
      $project: {
        holder: 1,
        totalPoint: 1,
        from: '$holderDetails.from',
      },
    },
  ])
}

export const insertPoints = async (
  results: Array<IPoint>) => {
  try {
    const listHolders = results.map((el) => el.holder)
    const refInfo = new Map()
    const data = await findReferrals({
      to: {
        $in: listHolders,
      },
    })

    // Create hashmap
    data.forEach((el) => {
      refInfo.set(el['to'], el['from'])
    })

    const referralRewardPoint: {
      holder: string
      point: number
      type: TYPE.REFERRAL_REWARD
      rewardBy: string
      rewardType: string
    }[] = []

    // Reward point for who invited this holder
    for (const result of results) {
      const ref = refInfo.get(result.holder)
      if (ref) {
        referralRewardPoint.push({
          holder: ref,
          point: (result.point * 10) / 100,
          rewardBy: result.holder,
          rewardType: result.type,
          type: TYPE.REFERRAL_REWARD,
        })
      }
    }

    const docs = [...referralRewardPoint, ...results]
    if (docs.length) {
      await createPoint(docs)
    }
  } catch (error) {
    console.error(error)
    throw ("Insert points failed")
  }
}
