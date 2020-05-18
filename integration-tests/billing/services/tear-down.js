const chargeVersions = require('./charge-versions');
const regions = require('./regions');
const licences = require('./licences');
const batches = require('./batches');
const crm = require('./crm');
const cmConnector = require('../../../src/lib/connectors/charge-module/bill-runs');

/**
 * Removes all created test data
 * @param {Object} [data] - billing batch data
 * @return {Promise}
 */
const tearDown = async (data) => {
  await batches.tearDown();
  await chargeVersions.tearDown();
  await licences.tearDown();
  await regions.tearDown();
  await crm.tearDown();

  // Delete batch in charge module
  if (data && data.externalId) {
    await cmConnector.delete(data.externalId);
  }
};

exports.tearDown = tearDown;
