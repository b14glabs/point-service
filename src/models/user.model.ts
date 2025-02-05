import { InferRawDocType, Schema, model } from 'mongoose'

const schemaDefinition = {
  evmAddress: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    unique: true,
    required: false,
  },
  referFrom: {
    type: String,
    required: false,
  },
} as const

const userlSchema = new Schema(schemaDefinition, {
  timestamps: { createdAt: true, updatedAt: true },
})

export const User = model('User', userlSchema)

export type IUser = InferRawDocType<typeof schemaDefinition>
