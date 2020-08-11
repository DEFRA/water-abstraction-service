const jobs = require('./jobs');

module.exports = {
  name: 'billingRegisterSubscribers',
  register: async server => {
    // Bill run is created both in our tables and in the CM
    await server.createSubscription(jobs.createBillRun);
    // Work out which charge versions are affected by the selected bill run
    // type/financial year
    await server.createSubscription(jobs.populateBatchChargeVersions);

    // Do two-part tariff matching process for two-part tariff runs
    // and supplementary (if needed)
    // Skipped for annual
    await server.createSubscription(jobs.twoPartTariffMatching);

    // Get all charge version/financial year combinations generated
    // above and publish a new job for each
    await server.createSubscription(jobs.processChargeVersions);

    // Process a charge version/financial year combination and calculate
    // which transactions are needed - writing to water.billing_transactions
    await server.createSubscription(jobs.processChargeVersion);

    // For supplementary billing, work out if any other credits/charges
    // are needed based on the transaction key
    // Publish a job to for each transaction to create a charge in the CM
    await server.createSubscription(jobs.prepareTransactions);

    // Creates a charge in the CM for a given row in water.billing_transactions
    await server.createSubscription(jobs.createCharge);

    // Once all charges generated, gets bill run summary data and stores
    // bill run totals in water.billing_batches
    await server.createSubscription(jobs.refreshTotals);
  }
};
