const ChangeReason = require('../models/change-reason');
const { isEmpty, pick } = require('lodash');
const { createMapper } = require('../object-mapper');
const { createModel } = require('./lib/helpers');

/**
 * Maps a row change reason data to the model
 * @param {Object} row
 * @return {Contact}
 */
const dbToModel = row => {
  if (isEmpty(row)) {
    return null;
  }
  const model = new ChangeReason(row.changeReasonId);
  return model.fromHash({
    ...pick(row, ['description', 'triggersMinimumCharge']),
    id: row.changeReasonId,
    type: row.type
  });
};

const pojoToModelMapper = createMapper()
  .map('changeReasonId').to('id')
  .copy(
    'description',
    'triggersMinimumCharge',
    'type'
  );

/**
 * Converts a plain object representation of a ChangeReason to a ChangeReason model
 * @param {Object} pojo
 * @return ChangeReason
 */
const pojoToModel = pojo => createModel(ChangeReason, pojo, pojoToModelMapper);

exports.dbToModel = dbToModel;
exports.pojoToModel = pojoToModel;
