'use strict';

const repos = require('../../../lib/connectors/repos');

/**
 * Creates the charge version years for any batch type
 * @param {Batch} batch
 * @return {Promise<Array>}
 */
const createForBatch = batch => {
  const actions = {
    [BATCH_TYPE.annual]: createAnnual,
    [BATCH_TYPE.supplementary]: createSupplementary,
    [BATCH_TYPE.twoPartTariff]: createTwoPartTariff
  };
  return actions[batch.type](batch);
};

exports.createForBatch = createForBatch;
