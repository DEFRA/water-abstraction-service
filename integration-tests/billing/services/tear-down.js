'use strict';

const batches = require('./batches');
const chargeVersions = require('./charge-versions');
const regions = require('./regions');
const licences = require('./licences');
const licenceAgreements = require('./licence-agreements');
const agreements = require('./agreements');
const purposeUses = require('./purpose-uses');
const purposesPrimary = require('./purpose-primary');
const purposesSecondary = require('./purpose-secondary');
const crm = require('./crm');
const cmConnector = require('../../../src/lib/connectors/charge-module/bill-runs');
const messageQueueV2 = require('../../../src/lib/message-queue-v2');
const returns = require('../services/returns');
const returnRequirements = require('../services/return-requirements');
const server = require('../../../index');

const deleteFromMessageQueue = () => messageQueueV2.deleteKeysByPattern('bull:*');

const deleteCMBatch = batch => batch.externalId && cmConnector.delete(batch.externalId);

const deleteJobsAndCMData = batch => Promise.all([
  deleteFromMessageQueue(),
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
  await returnRequirements.tearDownReturnPurposes();
  await returnRequirements.tearDownReturnRequirements();
  await returnRequirements.tearDownReturnVersions();
  await agreements.tearDown();
  await licences.tearDown();
  await regions.tearDown();
  await crm.tearDown();
  await returns.tearDown();
  await purposeUses.tearDown();
  await purposesPrimary.tearDown();
  await purposesSecondary.tearDown();

  const tasks = (batchesToDelete || []).map(deleteJobsAndCMData);
  await Promise.all(tasks);
  await server._stop;
};

exports.tearDown = tearDown;
