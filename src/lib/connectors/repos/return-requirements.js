'use strict'

const { ReturnRequirement } = require('../bookshelf')
const helpers = require('./lib/helpers')

const relatedModels = [
  'returnRequirementPurposes',
  'returnRequirementPurposes.purposeUse'
]

const findOneByExternalId = externalId =>
  helpers.findOne(ReturnRequirement, 'externalId', externalId, relatedModels)

const findOneById = id =>
  helpers.findOne(ReturnRequirement, 'returnRequirementId', id, relatedModels)

exports.create = data => helpers.create(ReturnRequirement, data)
exports.findOneByExternalId = findOneByExternalId
exports.findOneById = findOneById
