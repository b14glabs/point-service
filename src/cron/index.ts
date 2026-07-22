import cron from 'node-cron'
import { UserPoint } from '../models'
import { refreshUserPointJob } from './refreshUserPoint.job'

export const startCronJobs = async () => {
  // Ensure indexes exist before $merge (requires unique index on `holder`)
  await UserPoint.createIndexes()

  // Every hour on minute 0 (UTC)
  cron.schedule('0 * * * *', refreshUserPointJob, {
    timezone: 'UTC',
  })

  // Run immediately only when userPoint is empty (first deploy / after DB wipe)
  const count = await UserPoint.estimatedDocumentCount()
  if (count === 0) {
    console.log('[Cron] userPoint is empty, running initial refresh...')
    refreshUserPointJob().catch(console.error)
  } else {
    console.log(
      `[Cron] userPoint has ${count} docs, waiting for scheduled run`
    )
  }
}
