'use strict'

const Purpose = require('../models/purpose')

const dbToModel = row => {
  const model = new Purpose()
  return model.fromHash({
    id: row.purposeSecondaryId,
    code: row.legacyId,
    name: row.description,
    dateUpdated: row.dateUpdated,
    dateCreated: row.dateCreated,
    type: Purpose.PURPOSE_TYPES.secondary
  })
}

const pojoToModel = pojo => {
  const model = new Purpose()
  return model.fromHash(pojo)
}

exports.dbToModel = dbToModel
exports.pojoToModel = pojoToModel
