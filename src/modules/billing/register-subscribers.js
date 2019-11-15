const populateBillingBatch = require('./jobs/populate-billing-batch');

module.exports = [
  {
    method: 'subscribe',
    name: populateBillingBatch.jobName,
    handler: populateBillingBatch.handler
  }
];
