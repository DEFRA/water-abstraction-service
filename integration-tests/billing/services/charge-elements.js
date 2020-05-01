const data = require('./data');
const { ChargeElement, bookshelf } = require('../../../src/lib/connectors/bookshelf');

/**
 * Create the test licence in the region with the specified
 * @param {Object} region
 * @param {String} scenarioKey
 */
const create = async (chargeVersion, scenarioKey) => ChargeElement
  .forge({
    isTest: true,
    chargeVersionId: chargeVersion.get('chargeVersionId'),
    ...data.chargeElements[scenarioKey]
  })
  .save();

const tearDown = () =>
  bookshelf.knex('water.charge_elements')
    .where('is_test', true)
    .del();

exports.create = create;
exports.tearDown = tearDown;
