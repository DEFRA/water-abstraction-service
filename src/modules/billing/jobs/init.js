const populateBatchChargeVersions = require('./populate-batch-charge-versions');
const populateBatchTransactions = require('./populate-batch-transactions');

/**
 * Handles the response from populating the billing batch with charge versions and decides
 * whether or not to publish a new job to continue with the batch flow.
 *
 * @param {Object} job PG Boss job (including response from populateBatchChargeVersions handler)
 */
const handlePopulateBatchChargeVersionsComplete = async job => {
  const { chargeVersionCount } = job.data.response;
  const { eventId } = job.data.request.data;

  if (chargeVersionCount > 0) {
    populateBatchTransactions.publish(eventId);
  }
};

/**
 * Registers subscribers with the PG Boss message queue
 * @param  {Object}  messageQueue - PG boss message queue
 * @return {Promise}              resolves when all jobs registered
 */
const registerSubscribers = async messageQueue => {
  await messageQueue.subscribe(populateBatchChargeVersions.jobName, populateBatchChargeVersions.handler);
  await messageQueue.onComplete(populateBatchChargeVersions.jobName, handlePopulateBatchChargeVersionsComplete);

  await messageQueue.subscribe(populateBatchTransactions.jobName, populateBatchTransactions.handler);
};

exports.registerSubscribers = registerSubscribers;
