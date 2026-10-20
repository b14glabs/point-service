import { UserPoint } from '../models'

export const countUserPoint = () => {
  return UserPoint.estimatedDocumentCount()
}

export const findUserPointWithRank = async (holder: string) => {
  const userPoint = await UserPoint.findOne(
    { holder },
    { _id: 0, holder: 1, totalPoint: 1 },
  ).lean()
  if (!userPoint) return null

  const higherCount = await UserPoint.countDocuments({
    totalPoint: { $gt: userPoint.totalPoint },
  })
  return { ...userPoint, rank: higherCount + 1 }
}

export const getUserPointLeaderboard = (page: number, limit: number) => {
  return UserPoint.find(
    {},
    { _id: 0, holder: 1, totalPoint: 1, refferFrom: 1, lastUpdate: 1 },
  )
    .sort({ totalPoint: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
}
