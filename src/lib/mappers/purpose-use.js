'use strict'

const PurposeUse = require('../models/purpose-use')

const dbToModel = row => {
  const model = new PurposeUse(row.purposeUseId)
  return model.fromHash({
    code: row.legacyId,
    name: row.description,
    dateUpdated: row.dateUpdated,
    dateCreated: row.dateCreated,
    lossFactor: row.lossFactor,
    isTwoPartTariff: row.isTwoPartTariff
  })
}

/**
 * Converts a plain object representation of a PurposeUse to a PurposeUse model
 * @param {Object} pojo
 * @return PurposeUse
 */
const pojoToModel = pojo => {
  const model = new PurposeUse()
  return model.fromHash(pojo)
}

exports.dbToModel = dbToModel
exports.pojoToModel = pojoToModel
