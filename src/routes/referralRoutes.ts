import { Router } from 'express'
import apicache from 'apicache'
import {
  createRef,
  getCheckAddress,
  getTotalReferral,
  verifyRef,
} from '../controllers/referralController'

const router: Router = Router()

const cache = apicache.middleware

router.post('/create-referral', createRef)
router.post('/verify-referral', verifyRef)
router.get('/check', getCheckAddress)
router.get('/total-referral/:address', getTotalReferral)

export default router
