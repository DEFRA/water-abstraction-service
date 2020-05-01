const data = require('./data');
const { ChargeVersion, bookshelf } = require('../../../src/lib/connectors/bookshelf');

/**
 * Create the test licence in the region with the specified
 * @param {Object} region
 * @param {String} scenarioKey
 */
const create = async (region, licence, scenarioKey) => ChargeVersion
  .forge({
    isTest: true,
    regionCode: region.get('naldRegionId'),
    licenceRef: licence.get('licenceRef'),
    ...data.chargeVersions[scenarioKey]
  })
  .save();

const tearDown = () =>
  bookshelf.knex('water.charge_versions')
    .where('is_test', true)
    .del();

exports.create = create;
exports.tearDown = tearDown;
