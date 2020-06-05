'use strict';

const Purpose = require('../../../lib/models/purpose');

const dbToModelUse = row => {
  const purpose = new Purpose(row.purposeUseId);
  purpose.fromHash({
    type: Purpose.PURPOSE_TYPES.use,
    code: row.legacyId,
    name: row.description
  });
  return purpose;
};

exports.dbToModelUse = dbToModelUse;
