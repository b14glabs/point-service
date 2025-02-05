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

const pointSchema = new Schema(schemaDefinition, {
  timestamps: { createdAt: true, updatedAt: true },
  collection: 'point',
})
pointSchema.plugin(paginate)

export type IPoint = InferRawDocType<typeof schemaDefinition>

export const Point = model('Point', pointSchema)
