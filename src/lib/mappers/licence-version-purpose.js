'use strict';

const LicenceVersionPurpose = require('../models/licence-version-purpose');
const DateRange = require('../models/date-range');

const purposeUseMapper = require('../mappers/purpose-use');
const abstractionPeriodMapper = require('../mappers/abstraction-period');

const getTimeLimitedPeriod = dbRow => {
  return dbRow.timeLimitedStartDate
    ? new DateRange(dbRow.timeLimitedStartDate, dbRow.timeLimitedEndDate)
    : null;
};

const dbToModel = row => {
  const licenceVersion = new LicenceVersionPurpose(row.licenceVersionPurposeId);

  if (row.purposeUse) {
    licenceVersion.purposeUse = purposeUseMapper.dbToModel(row.purposeUse);
  }

  return licenceVersion.fromHash({
    licenceVersionId: row.licenceVersionId,
    externalId: row.externalId,
    dateUpdated: row.dateUpdated,
    dateCreated: row.dateCreated,
    notes: row.notes,
    annualQuantity: row.annualQuantity,
    abstractionPeriod: abstractionPeriodMapper.dbToModel(row),
    timeLimitedPeriod: getTimeLimitedPeriod(row)
  });
};

exports.dbToModel = dbToModel;
