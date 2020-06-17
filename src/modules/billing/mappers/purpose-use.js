'use strict';

const PurposeUse = require('../../../lib/models/purpose-use');

const dbToModel = row => {
  const purpose = new PurposeUse(row.purposeUseId);
  purpose.fromHash({
    code: row.legacyId,
    name: row.description,
    lossFactor: row.lossFactor
  });
  return purpose;
};

exports.dbToModel = dbToModel;
