'use strict';

const User = require('../models/user');

/**
 * Maps json data from DB to User model
 * @param {Object} data user data from DB
 * @return {User}
 */
const dbToModel = data => {
  if (!data) return null;
  const { id, email } = data;
  return new User(id, email);
};

const pojoToModel = dbToModel;

const modelToDb = model =>
  model === null
    ? null
    : model.toJSON();

exports.dbToModel = dbToModel;
exports.pojoToModel = pojoToModel;
exports.modelToDb = modelToDb;
