import { InferRawDocType, Schema, model } from 'mongoose'
import { paginate } from './plugin/pagination.plugin'
import { time } from 'console'

const schemaDefinition = {
  holder: {
    type: String,
    required: true,
  },
  point: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  coreReward: String,
  rewardBy: String,
  rewardType: String,
  txId: {
    type: String,
  },
  receiver: {
    type: String
  },
  isBtcClaim: Boolean,
  amount: String,
  time: Date,
  isAsxNftHolder: Boolean
}


const pointSchema = new Schema(schemaDefinition, {
  timestamps: { createdAt: true, updatedAt: true },
  collection: 'point',
})

pointSchema.plugin(paginate)
// for dual core
pointSchema.index(
  {
    time: 1,
    holder: 1,
    type: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      time: { $type: 'date' },
      type: { $eq: 'dual-core-snapshot' },
    },
  }
)
// for claim event 
pointSchema.index({
  txId: 1,
  receiver: 1,
}, {
  unique: true,
  sparse: true
})
//
pointSchema.index({
  type: 1,
  holder: 1,
  createdAt: 1,
  point: 1,
  receiver: 1,
  txId: 1,
}, {
  unique: true,
  sparse: true
})

export type IPoint = InferRawDocType<typeof schemaDefinition>
export const Point = model('Point', pointSchema)
