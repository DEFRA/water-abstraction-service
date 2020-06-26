'use strict';

const PurposeUse = require('../models/purpose-use');

const dbToModel = row => {
  const licenceVersion = new PurposeUse(row.purposeUseId);

  return licenceVersion.fromHash({
    code: row.legacyId,
    name: row.description,
    dateUpdated: row.dateUpdated,
    dateCreated: row.dateCreated,
    lossFactor: row.lossFactor,
    isTwoPartTariff: row.isTwoPartTariff
  });
};

exports.dbToModel = dbToModel;
