import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express, { Express, Router } from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import Web3 from 'web3'
import snapshotRoutes from './routes/snapshotRoutes'

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3001
export const web3 = new Web3(process.env.RPC_URL)

app.use(bodyParser.json())
app.use(cors())
app.use(morgan(':method :url :status - :response-time ms'))

const router: Router = Router()
router.use('/point', snapshotRoutes)
app.use('/restake', router)

mongoose
  .connect(process.env.MONGO_URL, { dbName: 'btc_restaking' })
  .then(() => {
    console.log('[DB]: Connected to MongoDB')
    app.listen(port, async () => {
      console.log(`[server]: Server is running at http://localhost:${port}`)
    })
  })
