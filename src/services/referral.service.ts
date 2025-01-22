import { RootFilterQuery } from 'mongoose'
import { IReferral, Referral } from '../models'

export const findReferral = (filter: RootFilterQuery<IReferral>) => {
  return Referral.findOne(filter)
}

export const findReferrals = (filter: RootFilterQuery<IReferral>) => {
  return Referral.find(filter)
}

export const countReferrals = (filter: RootFilterQuery<IReferral>) => {
  return Referral.countDocuments(filter)
}
