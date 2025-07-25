import { Router } from 'express'
import apicache from 'apicache'
import {
  getTotalPoint,
  getHistory,
  getLeaderboard,
  getEarnToday,
} from '../controllers/pointController'
import { savePoint } from '../controllers/savePointController'
import referralRouter from "./referralRoutes"

const router: Router = Router()

const cache = apicache.middleware

router.get('/total-point/:holder', cache('1 minute'), getTotalPoint)
router.get('/history/:holder', cache('1 minute'), getHistory)
router.get('/leaderboard', cache('1 minute'), getLeaderboard)
router.post('/save', savePoint)

router.get("/today-earn/:address", getEarnToday)

router.use("/referral", referralRouter)


export default router
