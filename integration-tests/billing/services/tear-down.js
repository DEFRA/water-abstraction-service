const chargeVersions = require('./charge-versions');
const regions = require('./regions');
const licences = require('./licences');
const batches = require('./batches');
const crm = require('./crm');

/**
 * Removes all created test data
 * @return {Promise}
 */
const tearDown = async () => {
  await licences.tearDown();
  await batches.tearDown();
  await chargeVersions.tearDown();
  await regions.tearDown();
  await crm.tearDown();

  // @TODO delete batch in charge module
};

exports.tearDown = tearDown;
