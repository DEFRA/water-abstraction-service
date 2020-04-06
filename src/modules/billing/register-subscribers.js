const jobs = require('./jobs');

module.exports = {
  name: 'billingRegisterSubscribers',
  register: async server => {
    await server.createSubscription(jobs.createBillRun);
    await server.createSubscription(jobs.populateBatchChargeVersions);
    await server.createSubscription(jobs.processChargeVersion);
    await server.createSubscription(jobs.prepareTransactions);
    await server.createSubscription(jobs.createCharge);
    await server.createSubscription(jobs.refreshTotals);
  }
};
