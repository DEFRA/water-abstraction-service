const data = require('./data');
const { ChargeElement, bookshelf } = require('../../../src/lib/connectors/bookshelf');

/**
 * Create the charge element with the scenario key, attached to the
 * specified charge version
 * @param {Object} chargeVersion - bookshelf model
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
