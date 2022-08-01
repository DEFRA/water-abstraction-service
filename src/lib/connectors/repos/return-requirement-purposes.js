'use strict'

const { ReturnRequirementPurpose } = require('../bookshelf')
const helpers = require('./lib/helpers')

const findOneByExternalId = externalId =>
  helpers.findOne(ReturnRequirementPurpose, 'externalId', externalId)

exports.create = data => helpers.create(ReturnRequirementPurpose, data)
exports.findOneByExternalId = findOneByExternalId
