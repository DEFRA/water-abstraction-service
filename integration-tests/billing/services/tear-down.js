'use strict';

const { bookshelf } = require('../../../src/lib/connectors/bookshelf');
const crmConnector = require('./connectors/crm');
const batches = require('./batches');
const cmConnector = require('../../../src/lib/connectors/charge-module/bill-runs');
const returnsConnector = require('../services/connectors/returns');
const returnRequirements = require('../services/return-requirements');
const server = require('../../../index');

const deleteCMBatch = batch => batch.externalId && cmConnector.delete(batch.externalId);

const deleteJobsAndCMData = (server, batch) => Promise.all([
  server.queueManager.deleteKeysByPattern('bull:*'),
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

  const tasks = (batchesToDelete || []).map(batch => deleteJobsAndCMData(server, batch));
  await Promise.all(tasks);
  await server._stop;
};

exports.tearDown = tearDown;
