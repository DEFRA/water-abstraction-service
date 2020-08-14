const ChangeReason = require('../models/change-reason');
const { isEmpty, pick } = require('lodash');

/**
 * Maps a row change reason data to the model
 * @param {Object} row
 * @return {Contact}
 */
const dbToModel = row => {
  if (isEmpty(row)) {
    return null;
  }
  const model = new ChangeReason();
  return model.fromHash({
    ...pick(row, ['triggersMinimumCharge']),
    id: row.changeReasonId,
    reason: row.description
  });
};

exports.dbToModel = dbToModel;
