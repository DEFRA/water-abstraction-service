'use strict';

const crmConnector = require('./connectors/crm');
const batches = require('./batches');
const chargeVersions = require('./charge-versions');
const regions = require('./regions');
const licences = require('./licences');
const licenceAgreements = require('./licence-agreements');
const financialAgreementTypes = require('./financial-agreement-types');
const purposeUses = require('./purpose-uses');
const purposesPrimary = require('./purpose-primary');
const purposesSecondary = require('./purpose-secondary');
const cmConnector = require('../../../src/lib/connectors/charge-module/bill-runs');
const returnsConnector = require('../services/connectors/returns');
const messageQueueV2 = require('../../../src/lib/message-queue-v2');
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
  await financialAgreementTypes.tearDown();
  await licences.tearDown();
  await regions.tearDown();
  await crmConnector.tearDown();
  await returnsConnector.tearDown();
  await purposeUses.tearDown();
  await purposesPrimary.tearDown();
  await purposesSecondary.tearDown();

  const tasks = (batchesToDelete || []).map(deleteJobsAndCMData);
  await Promise.all(tasks);
  await server._stop;
};

exports.tearDown = tearDown;
