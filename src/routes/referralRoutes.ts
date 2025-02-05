import { Router } from 'express'
import apicache from 'apicache'
import {
  createRef,
  getCheckAddress,
  verifyRef,
} from '../controllers/referralController'

const router: Router = Router()

const cache = apicache.middleware

router.post('/create-ref', createRef)
router.post('/verify-ref', verifyRef)
router.get('/check', getCheckAddress)

export default router
