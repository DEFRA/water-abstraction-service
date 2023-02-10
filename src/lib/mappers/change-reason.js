'use strict'

const ChangeReason = require('../models/change-reason')
const { createMapper } = require('../object-mapper')
const { createModel } = require('./lib/helpers')

/**
 * Maps a row change reason data to the model
 * @param {Object} row
 * @return {Contact}
 */
const dbToModel = row => {
  if (!row || Object.keys(row).length === 0) {
    return null
  }

  const model = new ChangeReason(row.changeReasonId)
  return model.pickFrom(row, [
    'description',
    'triggersMinimumCharge',
    'type',
    'isEnabledForNewChargeVersions'
  ])
}

const pojoToModelMapper = createMapper()
  .copy(
    'id',
    'description',
    'triggersMinimumCharge',
    'type',
    'isEnabledForNewChargeVersions'
  )

/**
 * Converts a plain object representation of a ChangeReason to a ChangeReason model
 * @param {Object} pojo
 * @return ChangeReason
 */
const pojoToModel = pojo => createModel(ChangeReason, pojo, pojoToModelMapper)

exports.dbToModel = dbToModel
exports.pojoToModel = pojoToModel
