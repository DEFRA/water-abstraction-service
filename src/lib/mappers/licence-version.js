'use strict'

const LicenceVersion = require('../models/licence-version')
const licenceVersionPurposeMapper = require('../mappers/licence-version-purpose')

const dbToModel = row => {
  const licenceVersion = new LicenceVersion(row.licenceVersionId)
  const { licenceVersionPurposes } = row

  if (licenceVersionPurposes) {
    const versionPurposes = licenceVersionPurposes.map(licenceVersionPurposeMapper.dbToModel)
    licenceVersion.licenceVersionPurposes = versionPurposes
  }

  return licenceVersion.fromHash({
    status: row.status,
    endDate: row.endDate,
    startDate: row.startDate,
    externalId: row.externalId,
    dateUpdated: row.dateUpdated,
    dateCreated: row.dateCreated,
    licenceId: row.licenceId,
    issue: row.issue,
    increment: row.increment
  })
}

exports.dbToModel = dbToModel
