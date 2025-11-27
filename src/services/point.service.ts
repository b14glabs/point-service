import { RootFilterQuery } from 'mongoose'
import { IPoint, Point } from '../models'
import { findReferrals } from './referral.service'
import { TYPE } from '../const'

const createPoint = (data: IPoint[]) => {
  return Point.insertMany(data, { ordered: false })
}

export const findTotalPoint = (user: string) => {
  return Point.aggregate([
    {
      $group:
      {
        _id: "$holder",
        totalPoint: {
          $sum: "$point"
        },
        holder: { $first: "$holder" }
      }
    },
    {
      $setWindowFields: {
        sortBy: {
          totalPoint: -1
        },
        output: {
          rank: {
            $rank: {}
          },
        }
      }
    },
    {
      $match: {
        _id: user
      }
    }
  ]) as unknown as { rank: number, totalPoint: number, holder: string}[]
}

export const findTotalPointWithEvmAndBabylon = ({
  evmAddress,
  babylonAddress
}: {
  evmAddress?: string,
  babylonAddress?: string
}) => {
  return Point.aggregate([
    {
      $group: {
        _id: "$holder",
        totalPoint: { $sum: "$point" }
      }
    },
    {
      $setWindowFields: {
        sortBy: { totalPoint: -1 },
        output: {
          rank: { $rank: {} }
        }
      }
    },
    {
      $match: {
        _id: { 
          $in: [evmAddress, babylonAddress].filter(Boolean) 
        }
      }
    },
    {
      $group: {
        _id: null,
        evmPoint: {
          $sum: {
            $cond: [{ $eq: ["$_id", evmAddress] }, "$totalPoint", 0]
          }
        },
        babylonPoint: {
          $sum: {
            $cond: [{ $eq: ["$_id", babylonAddress] }, "$totalPoint", 0]
          }
        },
        bestRank: { $min: "$rank" }
      }
    },
    {
      $addFields: {
        totalPoint: { $add: ["$evmPoint", "$babylonPoint"] },
        rank: "$bestRank"
      }
    },
    {
      $project: {
        _id: 0,
        evmPoint: 1,
        babylonPoint: 1,
        totalPoint: 1,
        rank: 1
      }
    }
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
    const listHolders = results.map((el) => el.holder.toLowerCase())
    const refInfo = new Map()
    // Referral document address field is lowercase
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
    if (!error?.toString()?.includes('duplicate key error')) {
      throw ("Insert points failed")
    }
  }
}

export const getEarnTodayRequest = (holder: string) => {
  const date = new Date()
  date.setUTCHours(0,0,0,0)
  return Point.aggregate([
  {
    $match: {
      holder: holder.toLowerCase(),
      createdAt: {
        $gte: date
      },
      type: { $ne: "referral-reward" }
    }
  },
  {
    $group: {
      _id: null,
      totalPoint: {
        $sum: "$point"
      }
    }
  }
])
}
