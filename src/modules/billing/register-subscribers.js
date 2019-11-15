const populateBillingBatch = require('./jobs/populate-billing-batch');

module.exports = {
  name: 'billingRegisterSubscribers',
  register: async server => {
    await server.messageQueue.subscribe(populateBillingBatch.jobName, populateBillingBatch.handler);
  }
};
