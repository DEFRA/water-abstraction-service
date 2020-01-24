const { get } = require('lodash');
const event = require('../../../lib/event');

const getEventForBatch = async batchId => {
  const filter = {
    type: 'billing-batch',
    "metadata->'batch'->>'billing_batch_id'": batchId
  };

  const { rows } = await event.repo.find(filter);
  return get(rows, '[0]', null);
};

exports.getEventForBatch = getEventForBatch;
