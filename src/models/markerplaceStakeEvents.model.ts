import mongoose, { InferRawDocType } from 'mongoose'
import { paginate } from './plugin/pagination.plugin'

const schemaDefinition = {
  delegator: {
    type: String,
    required: true,
  },
  validator: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  receiver: {
    type: String,
    required: true,
  },
}

const schema = new mongoose.Schema(schemaDefinition, {
  timestamps: { createdAt: true, updatedAt: true },
  collection: 'MarketplaceStakeEvents',
})

schema.plugin(paginate)

export const MarketplaceStakeEvents = mongoose.connection
  .useDb('marketplace')
  .model('MarketplaceStakeEvents', schema)

export type IMarketplaceStakeEvent = InferRawDocType<typeof schemaDefinition>
