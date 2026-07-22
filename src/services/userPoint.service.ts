import { UserPoint } from '../models'

export const countUserPoint = () => {
  return UserPoint.estimatedDocumentCount()
}

export const getUserPointLeaderboard = (page: number, limit: number) => {
  return UserPoint.find(
    {},
    { _id: 0, holder: 1, totalPoint: 1, refferFrom: 1, lastUpdate: 1 }
  )
    .sort({ totalPoint: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
}
