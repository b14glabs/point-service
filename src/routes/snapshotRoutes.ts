import { Router } from 'express'
import apicache from 'apicache'
import {
  getTotalPoint,
  getHistory,
  getLeaderboard,
} from '../controllers/snapController'

const router: Router = Router()

const cache = apicache.middleware

router.get('/total-point/:holder', cache('1 minute'), getTotalPoint)
router.get('/history/:holder', cache('1 minute'), getHistory)
router.get('/leaderboard', cache('1 minute'), getLeaderboard)

export default router
