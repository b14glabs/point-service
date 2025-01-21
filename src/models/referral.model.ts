import { InferRawDocType, Schema, model } from 'mongoose'

const schemaDefinition = {
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    unique: true,
    required: true,
  },
} as const

const referralSchema = new Schema(schemaDefinition, {
  timestamps: { createdAt: true, updatedAt: true },
})

export const Referral = model('Referral', referralSchema)

export type IReferral = InferRawDocType<typeof schemaDefinition>
