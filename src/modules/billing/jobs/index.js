'use strict';

const QueueManager = require('./lib/QueueManager');

const createBillRun = require('./create-bill-run');
const createCharge = require('./create-charge');
const populateBatchChargeVersions = require('./populate-batch-charge-versions');
const prepareTransactions = require('./prepare-transactions');
const processChargeVersionYear = require('./process-charge-version-year');
const processChargeVersions = require('./process-charge-versions');
const refreshTotals = require('./refresh-totals');
const twoPartTariffMatching = require('./two-part-tariff-matching');

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

exports.queueManager = queueManager;
