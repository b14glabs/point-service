import { Router } from 'express'
import apicache from 'apicache'
import {
  createRef,
  getCheckAddress,
  getTotalReferral,
  verifyRef,
  getReferInfo
} from '../controllers/referralController'

const router: Router = Router()

const cache = apicache.middleware

router.post('/create-referral', createRef)
router.post('/verify-referral', verifyRef)
router.get('/check', getCheckAddress)
router.get('/refer-by', getReferInfo)
router.get('/total-referral/:address', cache("30 seconds"), getTotalReferral)

export default router
