'use strict'

const User = require('../models/user')

/**
 * Maps json data from DB to User model
 * @param {Object} data user data from DB
 * @return {User}
 */
const dbToModel = data => {
  if (!data) return null
  const { id, email } = data
  return new User(id, email)
}

const pojoToModel = dbToModel

const modelToDb = (model) => {
  return model instanceof Object ? model.toJSON() : null
}

exports.dbToModel = dbToModel
exports.pojoToModel = pojoToModel
exports.modelToDb = modelToDb
