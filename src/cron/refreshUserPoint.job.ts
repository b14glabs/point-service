import { Point, UserPoint } from '../models'
import { MarketplaceStakeEvents } from '../models/markerplaceStakeEvents.model'

let isRunning = false

export const refreshUserPointJob = async () => {
  if (isRunning) {
    console.log(
      '[Cron][refreshUserPoint] Skipped: previous run still in progress'
    )
    return
  }
  isRunning = true
  const start = Date.now()
  console.log('[Cron][refreshUserPoint] Started')

  try {
    const now = new Date()

    // Step 1: aggregate Point → userPoint (with referral join)
    await Point.aggregate(
      [
        {
          $group: {
            _id: { $toLower: '$holder' },
            totalPoint: { $sum: '$point' },
          },
        },
        {
          $lookup: {
            from: 'referrals',
            localField: '_id',
            foreignField: 'to',
            as: 'ref',
          },
        },
        {
          $project: {
            _id: 0,
            holder: '$_id',
            totalPoint: 1,
            refferFrom: { $arrayElemAt: ['$ref.from', 0] },
            lastUpdate: now,
          },
        },
        {
          $merge: {
            into: 'userPoint',
            on: 'holder',
            whenMatched: 'replace',
            whenNotMatched: 'insert',
          },
        },
      ],
      { allowDiskUse: true }
    )

    // Step 2: upsert marketplace stakers with 0 points if not yet present
    const stakers: string[] = await MarketplaceStakeEvents.distinct('delegator')
    if (stakers.length) {
      const ops = stakers.map((s) => {
        const holder = s.toLowerCase()
        return {
          updateOne: {
            filter: { holder },
            update: {
              $setOnInsert: {
                holder,
                totalPoint: 0,
                lastUpdate: now,
              },
            },
            upsert: true,
          },
        }
      })
      await UserPoint.bulkWrite(ops, { ordered: false })
    }

    const duration = Date.now() - start
    const count = await UserPoint.estimatedDocumentCount()
    console.log(
      `[Cron][refreshUserPoint] Done in ${duration}ms, ${count} docs in userPoint`
    )
  } catch (error) {
    console.error('[Cron][refreshUserPoint] Failed', error)
  } finally {
    isRunning = false
  }
}
