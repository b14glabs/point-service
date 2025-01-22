import { RootFilterQuery } from 'mongoose'
import { ISnapshot, Snapshot } from '../models'

export const getSnapshotRecords = () => {
  return Snapshot.aggregate<{ _id: string; totalPoints: number }>([
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

export const findSnapshot = (filter: RootFilterQuery<ISnapshot>) => {
  return Snapshot.findOne(filter)
}

export const getHolders = () => {
  return Snapshot.distinct("holder")
}

export const countHolder = () => {
  return Snapshot.aggregate<{ totalHolders: number }>([
    {
      $group: { _id: '$holder' },
    },
    {
      $count: 'totalHolders',
    },
  ])
}

export const countRecordsByHolder = (holder: string) => {
  return Snapshot.countDocuments({ holder })
}

export const findRecordsWithPagination = (
  filter: RootFilterQuery<ISnapshot>,
  options: any
) => {
  return (Snapshot as any).paginate(filter, options)
}

export const getPointLeaderboard = (page: number, limit: number) => {
  return Snapshot.aggregate([
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
