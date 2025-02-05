import { RootFilterQuery } from 'mongoose'
import { IUser, User } from '../models'

export const createUser = (doc: IUser) => {
  return User.create(doc)
}

export const findUser = (filter: RootFilterQuery<IUser>) => {
  return User.findOne(filter)
}
