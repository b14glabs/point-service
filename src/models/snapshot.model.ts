import { InferRawDocType, Schema, model } from 'mongoose'
import { paginate } from './plugin/pagination.plugin'

const schemaDefinition = {
  holder: {
    type: String,
    required: true,
  },
  point: {
    type: Number,
    required: true,
  },
  rewardBy: String,
  rewardType: String,
  type: String,
} as const

const snapshotSchema = new Schema(schemaDefinition, {
  timestamps: { createdAt: true, updatedAt: true },
  collection: 'snapshot',
})
snapshotSchema.plugin(paginate)

export type ISnapshot = InferRawDocType<typeof schemaDefinition>

export const Snapshot = model('Snapshot', snapshotSchema)
