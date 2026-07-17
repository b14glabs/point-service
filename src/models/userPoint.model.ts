import { InferRawDocType, Schema, model } from 'mongoose'

const schemaDefinition = {
  holder: {
    type: String,
    required: true,
    unique: true,
  },
  totalPoint: {
    type: Number,
    required: true,
    default: 0,
  },
  refferFrom: {
    type: String,
  },
  lastUpdate: {
    type: Date,
    default: Date.now,
  },
}

const userPointSchema = new Schema(schemaDefinition, {
  timestamps: false,
  collection: 'userPoint',
})

userPointSchema.index({ totalPoint: -1 })

export type IUserPoint = InferRawDocType<typeof schemaDefinition>
export const UserPoint = model('UserPoint', userPointSchema)
