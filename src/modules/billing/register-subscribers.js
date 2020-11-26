'use strict';

const QueueManager = require('./jobs/lib/QueueManager');

const createBillRun = require('./jobs/create-bill-run');
const createCharge = require('./jobs/create-charge');
const populateBatchChargeVersions = require('./jobs/populate-batch-charge-versions');
const prepareTransactions = require('./jobs/prepare-transactions');
const processChargeVersionYear = require('./jobs/process-charge-version-year');
const processChargeVersions = require('./jobs/process-charge-versions');
const refreshTotals = require('./jobs/refresh-totals');
const twoPartTariffMatching = require('./jobs/two-part-tariff-matching');

module.exports = {
  name: 'queueManager',
  register: async server => {
    const queueManager = new QueueManager();
    queueManager
      .register(createBillRun)
      .register(createCharge)
      .register(populateBatchChargeVersions)
      .register(prepareTransactions)
      .register(processChargeVersionYear)
      .register(processChargeVersions)
      .register(refreshTotals)
      .register(twoPartTariffMatching);

    server.decorate('request', 'queueManager', queueManager);
  }
};
