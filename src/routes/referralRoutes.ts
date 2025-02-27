import { Router } from 'express'
import apicache from 'apicache'
import {
  createRef,
  getCheckAddress,
  verifyRef,
  getReferInfo
} from '../controllers/referralController'

const router: Router = Router()

const cache = apicache.middleware

router.post('/create-referral', createRef)
router.post('/verify-referral', verifyRef)
router.get('/check', cache("2 seconds"), getCheckAddress)
router.get('/refer-by', cache("2 seconds"), getReferInfo)

export default router
