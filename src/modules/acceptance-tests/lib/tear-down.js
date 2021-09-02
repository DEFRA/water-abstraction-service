'use strict';

const { bookshelf } = require('../../../src/lib/connectors/bookshelf');

const billingService = require('./services/billing');
const chargeVersionService = require('./services/charge-versions');
const gaugingStationService = require('./services/gauging-stations');
const returnRequirements = require('./services/return-requirements');
const licenceAgreements = require('./services/licence-agreements');

const deleteCMBatch = batch => batch.externalId && cmConnector.delete(batch.externalId);

const tearDownTable = tableName => bookshelf.knex(tableName)
  .where('is_test', true)
  .del();

const tearDown = async () => {
  await billingService.tearDown();

  await gaugingStationService.tearDown();
  await tearDownTable('water.gauging_stations');
  await tearDownTable('water.charge_elements');
  await chargeVersionService.tearDown();
  await tearDownTable('water.licence_agreements');

  await returnRequirements.tearDown();

  await tearDownTable('water.licence_agreements');
  await licenceAgreements.tearDown();
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
