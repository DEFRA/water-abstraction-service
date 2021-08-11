'use strict';

const { bookshelf } = require('../../../src/lib/connectors/bookshelf');
const crmConnector = require('./connectors/crm');
const batches = require('./batches');
const cmConnector = require('../../../src/lib/connectors/charge-module/bill-runs');
const returnsConnector = require('../services/connectors/returns');
const returnRequirements = require('../services/return-requirements');
const licenceAgreements = require('../services/licence-agreements');
const chargeVersions = require('../services/charge-versions');
const gaugingStations = require('../services/gauging-stations');
const returnVersions = require('./return-versions');
const returnRequirementPurposes = require('./return-requirements-purpose');
const invoices = require('./invoices');
const invoiceLicenses = require('./invoice-licenses');
const permits = require('./permits');

const messageQueue = require('../../../src/lib/message-queue-v2');

const deleteCMBatch = batch => batch.externalId && cmConnector.delete(batch.externalId);

const tearDownTable = tableName => bookshelf.knex(tableName)
  .where('is_test', true)
  .del();

/**
 * Removes all created test data
 *
 * @param {Array} [batchesToDelete] - billing batch data to delete
 * @return {Promise}
 */
const tearDown = async (...batchesToDelete) => {
  await gaugingStations.tearDownCypressCreatedLinkages();
  await tearDownTable('water.gauging_stations');
  await tearDownTable('water.charge_elements');
  await chargeVersions.tearDown();
  await tearDownTable('water.licence_agreements');

  await returnRequirements.tearDown();

  await tearDownTable('water.licence_agreements');
  await licenceAgreements.tearDownCypressCreatedLicenceAgreements();
  await tearDownTable('water.financial_agreement_types');

  console.log('- Tearing down acceptance test batches');
  await batches.tearDown();
  console.log('- Tearing down acceptance test licence versions');
  await tearDownTable('water.licence_versions');
  console.log('- Tearing down acceptance test licences');
  await tearDownTable('water.licences');
  console.log('- Tearing down acceptance test regions');
  await tearDownTable('water.regions');
  console.log('- Tearing down acceptance test crm');
  await crmConnector.tearDown();
  console.log('- Tearing down acceptance test invoiceLicences');
  await invoiceLicenses.delete();
  console.log('- Tearing down acceptance test invoices');
  await invoices.delete();
  console.log('- Tearing down acceptance test permits');
  await permits.delete();
  console.log('- Tearing down acceptance test return requirement purposes');
  await returnRequirementPurposes.delete();
  console.log('- Tearing down acceptance test return versions');
  await returnVersions.delete();
  console.log('- Tearing down acceptance test returns');
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
