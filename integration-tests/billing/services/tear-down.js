'use strict';

const batches = require('./batches');
const chargeVersions = require('./charge-versions');
const regions = require('./regions');
const licences = require('./licences');
const licenceAgreements = require('./licence-agreements');
const crm = require('./crm');
const cmConnector = require('../../../src/lib/connectors/charge-module/bill-runs');

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

  // Delete batch in charge module
  const idsToDelete = (batchesToDelete || [])
    .map(batch => batch.externalId)
    .filter(i => i);

  for (const externalId of idsToDelete) {
    await cmConnector.delete(externalId);
  }
};

exports.tearDown = tearDown;
