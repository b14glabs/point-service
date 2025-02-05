import { Request, Response } from 'express'
import * as crypto from 'crypto'
import * as secp256k1 from 'secp256k1'
import { insertPoints } from '../services'
export const savePoint = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { data, signature } = req.body
    try {
      const isValid = secp256k1.ecdsaVerify(
        Buffer.from(signature, 'hex'),
        crypto.createHash('sha256').update(JSON.stringify(data)).digest(),
        Buffer.from(process.env.VERIFY_PUBLIC_KEY, 'hex')
      )
      if (!isValid) throw Error('invalid')
    } catch (error) {
      console.error(error)
      res.status(403).json({ error: 'Invalid' })
      return
    }
    await insertPoints(data)
    res.status(200).json({ status: 'ok' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message || error })
  }
}
