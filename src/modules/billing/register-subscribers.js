
const populateBatchChargeVersions = require('./jobs/populate-batch-charge-versions');
const populateBatchTransactions = require('./jobs/populate-batch-transactions');

/**
 * Handles the response from populating the billing batch with charge versions and decides
 * whether or not to publish a new job to continue with the batch flow.
 *
 * @param {Object} job PG Boss job (including response from populateBatchChargeVersions handler)
 */
const handlePopulateBatchChargeVersionsComplete = (job, messageQueue) => {
  const { chargeVersionCount } = job.data.response;
  const { eventId } = job.data.request.data;

  if (chargeVersionCount > 0) {
    const message = populateBatchTransactions.createMessage(eventId);
    return messageQueue.publish(message);
  }
};

module.exports = {
  name: 'billingRegisterSubscribers',
  register: async server => {
    await server.messageQueue.subscribe(populateBatchChargeVersions.jobName, populateBatchChargeVersions.handler);
    await server.messageQueue.onComplete(populateBatchChargeVersions.jobName, job => {
      return handlePopulateBatchChargeVersionsComplete(job, server.messageQueue);
    });
    await server.messageQueue.subscribe(populateBatchTransactions.jobName, populateBatchTransactions.handler);
  }
};
