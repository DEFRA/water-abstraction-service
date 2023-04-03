/* eslint-disable camelcase */
'use strict'

const { createMapper } = require('../object-mapper')
const camelCaseKeys = require('../camel-case-keys')
const helpers = require('./lib/helpers')
const { truncate } = require('../object-helpers')

const ChargeCategory = require('../models/charge-category')

const csvToModel = data => {
  const chargeCategory = new ChargeCategory()

  const {
    reference,
    subsistence_charge,
    description,
    short_description,
    min_volume,
    max_volume,
    is_tidal,
    loss_factor,
    model_tier,
    is_restricted_source
  } = data
  return chargeCategory.fromHash({
    reference,
    description,
    subsistenceCharge: parseInt(subsistence_charge),
    shortDescription: truncate(short_description, 150),
    minVolume: parseInt(min_volume),
    maxVolume: parseInt(max_volume),
    isTidal: is_tidal,
    lossFactor: loss_factor,
    modelTier: model_tier,
    isRestrictedSource: is_restricted_source
  })
}

/* Humanize and copy fields */
const dbToModelMapper = createMapper()
  .map('billingChargeCategoryId').to('chargeCategoryId')
  .map('billingChargeCategoryId').to('id')
  .copy(
    'chargeCategoryId',
    'description',
    'shortDescription',
    'reference',
    'dateCreated',
    'dateUpdated',
    'minVolume',
    'maxVolume',
    'isTidal',
    'lossFactor',
    'modelTier',
    'isRestrictedSource',
    'subsistenceCharge'
  )

const dbToModel = row => helpers.createModel(ChargeCategory, camelCaseKeys(row), dbToModelMapper)

const pojoToModel = pojo => {
  const model = new ChargeCategory()
  return model.fromHash(pojo)
}

exports.pojoToModel = pojoToModel
exports.dbToModel = dbToModel
exports.csvToModel = csvToModel
