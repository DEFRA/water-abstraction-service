'use strict';

const createBillRun = require('./jobs/create-bill-run');
const rebilling = require('./jobs/rebilling');
const createCharge = require('./jobs/create-charge');
const populateBatchChargeVersions = require('./jobs/populate-batch-charge-versions');
const prepareTransactions = require('./jobs/prepare-transactions');
const processChargeVersionYear = require('./jobs/process-charge-version-year');
const processChargeVersions = require('./jobs/process-charge-versions');
const refreshTotals = require('./jobs/refresh-totals');
const twoPartTariffMatching = require('./jobs/two-part-tariff-matching');
const updateCustomer = require('./jobs/update-customer');

module.exports = {
  name: 'billing-jobs',
  dependencies: ['hapiBull'],
  register: async server => {
    server.queueManager
      .register(createBillRun)
      .register(rebilling)
      .register(createCharge)
      .register(populateBatchChargeVersions)
      .register(prepareTransactions)
      .register(processChargeVersionYear)
      .register(processChargeVersions)
      .register(refreshTotals)
      .register(twoPartTariffMatching)
      .register(updateCustomer);
  }
};
