'use strict';

const batches = require('./batches');
const chargeVersions = require('./charge-versions');
const regions = require('./regions');
const licences = require('./licences');
const licenceAgreements = require('./licence-agreements');
const crm = require('./crm');
const cmConnector = require('../../../src/lib/connectors/charge-module/bill-runs');
const server = require('../../../index');

const deleteBatchJobs = batch => server.messageQueue.deleteQueue(`billing.refreshTotals.${batch.billingBatchId}`);

const deleteCMBatch = batch => cmConnector.delete(batch.externalId);

const deleteJobsAndCMData = batch => Promise.all([
  deleteBatchJobs(batch),
  deleteCMBatch(batch)
]);

/**
 * Removes all created test data
 *
 * @param {Array} [batches] - billing batch data to delete
 * @return {Promise}
 */
const tearDown = async (...batchesToDelete) => {
  await batches.tearDown();
  await chargeVersions.tearDown();
  await licenceAgreements.tearDown();
  await licences.tearDown();
  await regions.tearDown();
  await crm.tearDown();

  const tasks = (batchesToDelete || []).map(deleteJobsAndCMData);
  await Promise.all(tasks);
};

exports.tearDown = tearDown;
