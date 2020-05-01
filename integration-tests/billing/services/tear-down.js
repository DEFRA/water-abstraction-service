const chargeVersions = require('./charge-versions');
const regions = require('./regions');
const licences = require('./licences');
const batches = require('./batches');

/**
 * Removes all created test data
 * @return {Promise}
 */
const tearDown = async () => {
  await licences.tearDown();
  await batches.tearDown();
  await chargeVersions.tearDown();
  await regions.tearDown();
};

exports.tearDown = tearDown;
