'use strict'

const DateRange = require('../models/date-range')
const ReturnRequirementVersion = require('../models/return-requirement-version')
const returnRequirementMapper = require('./return-requirement')

/**
 * Maps a row from water.return_versions to the ReturnRequirementVersion service model
 * @param {Object} row
 * @return {ReturnRequirementVersion} service model
 */
const dbToModel = (row) => {
  const model = new ReturnRequirementVersion()

  model.fromHash({
    id: row.returnVersionId,
    dateRange: new DateRange(row.startDate, row.endDate),
    status: row.status
  })

  if (row.returnRequirements) {
    model.returnRequirements = row.returnRequirements.map(returnRequirementMapper.dbToModel)
  }

  return model
}

exports.dbToModel = dbToModel
