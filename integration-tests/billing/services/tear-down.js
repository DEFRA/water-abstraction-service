'use strict';

const { bookshelf } = require('../../../src/lib/connectors/bookshelf');
const crmConnector = require('./connectors/crm');
const batches = require('./batches');
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
  await tearDownTable('water.charge_versions');
  await tearDownTable('water.licence_agreements');

  await returnRequirements.tearDown();

  await tearDownTable('water.financial_agreement_types');
  await tearDownTable('water.licences');
  await tearDownTable('water.regions');

  await crmConnector.tearDown();
  await returnsConnector.tearDown();

  await tearDownTable('water.purposes_primary');
  await tearDownTable('water.purposes_secondary');
  await tearDownTable('water.purposes_uses');

  await returnRequirements.tearDown();

  const tasks = (batchesToDelete || []).map(deleteJobsAndCMData);
  await Promise.all(tasks);
  await server._stop;
};

exports.tearDown = tearDown;
