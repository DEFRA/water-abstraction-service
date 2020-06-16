'use strict';

const LicenceVersion = require('../models/licence-version');

const dbToModel = row => {
  const licenceVersion = new LicenceVersion(row.licenceVersionId);

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
  });
};

exports.dbToModel = dbToModel;
