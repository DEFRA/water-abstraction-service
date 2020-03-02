const Purpose = require('../../../lib/models/purpose');

const dbToModelUse = row => {
  const purpose = new Purpose();
  purpose.fromHash({
    type: Purpose.PURPOSE_TYPES.use,
    code: row.id,
    name: row.description
  });
  return purpose;
};

exports.dbToModelUse = dbToModelUse;
