'use strict';

const { bookshelf } = require('../../../src/lib/connectors/bookshelf');
const crmConnector = require('./connectors/crm');
const batches = require('./batches');
const cmConnector = require('../../../src/lib/connectors/charge-module/bill-runs');
const returnsConnector = require('../services/connectors/returns');
const returnRequirements = require('../services/return-requirements');
const licenceAgreements = require('../services/licence-agreements');
const chargeVersions = require('../services/charge-versions');
const messageQueue = require('../../../src/lib/message-queue-v2');

const deleteCMBatch = batch => batch.externalId && cmConnector.delete(batch.externalId);

const tearDownTable = tableName => bookshelf.knex(tableName)
  .where('is_test', true)
  .del();

/**
 * Removes all created test data
 *
 * @param {Array} [batches] - billing batch data to delete
 * @return {Promise}
 */
const tearDown = async (...batchesToDelete) => {
  await batches.tearDown();

  await tearDownTable('water.charge_elements');
  await chargeVersions.tearDown();
  await tearDownTable('water.licence_agreements');

  await returnRequirements.tearDown();

  await tearDownTable('water.licence_agreements');
  await licenceAgreements.tearDownCypressCreatedLicenceAgreements();
  await tearDownTable('water.financial_agreement_types');
  await tearDownTable('water.licence_versions');
  await tearDownTable('water.licences');
  await tearDownTable('water.regions');

  await crmConnector.tearDown();
  await returnsConnector.tearDown();

  await tearDownTable('water.purposes_primary');
  await tearDownTable('water.purposes_secondary');
  await tearDownTable('water.purposes_uses');

  // Delete CM batches
  const tasks = (batchesToDelete || []).map(deleteCMBatch);
  await Promise.all(tasks);

  // Delete Bull MQ jobs
  await messageQueue.getQueueManager().deleteKeysByPattern('bull:*');
};

exports.tearDown = tearDown;
