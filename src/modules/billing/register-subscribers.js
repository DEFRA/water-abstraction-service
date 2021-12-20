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
const checkForUpdatedInvoiceAccounts = require('./jobs/check-for-updated-invoice-accounts');
const approveBatch = require('./jobs/approve-batch');
const deleteErroredBatch = require('./jobs/delete-errored-batch');
const customerFileRefresh = require('./jobs/customer-file-refresh');
const syncChargeCategories = require('./jobs/sync-charge-categories');
const syncSupportedSources = require('./jobs/sync-supported-sources');
const syncSupportedSourcesUpdate = require('./jobs/sync-supported-sources-update');

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
      .register(updateCustomer)
      .register(checkForUpdatedInvoiceAccounts)
      .register(approveBatch)
      .register(deleteErroredBatch)
      .register(customerFileRefresh)
      .register(syncChargeCategories)
      .register(syncSupportedSources)
      .register(syncSupportedSourcesUpdate);

    server.queueManager.add(syncChargeCategories.jobName);
    server.queueManager.add(syncSupportedSources.jobName);
    await server.queueManager.deleteKeysByPattern('*billing.customer-file-refresh*');
    server.queueManager.add(customerFileRefresh.jobName);
  }
};
