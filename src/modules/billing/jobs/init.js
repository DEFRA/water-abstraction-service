const populateBillingBatch = require('./populate-billing-batch');

/**
 * Registers subscribers with the PG Boss message queue
 * @param  {Object}  messageQueue - PG boss message queue
 * @return {Promise}              resolves when all jobs registered
 */
const registerSubscribers = async messageQueue => {
  await messageQueue.subscribe(populateBillingBatch.jobName, populateBillingBatch.handler);
};

exports.registerSubscribers = registerSubscribers;
