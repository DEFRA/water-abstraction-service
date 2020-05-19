const data = require('./data');
const { Licence, bookshelf } = require('../../../src/lib/connectors/bookshelf');
const { omit } = require('lodash');

/**
 * Create the test licence in the region with the specified
 * @param {Object} region
 * @param {String} scenarioKey
 */
const create = async (region, scenarioKey) => Licence
  .forge({
    isTest: true,
    regionId: region.get('regionId'),
    ...omit(data.licences[scenarioKey], 'documents')
  })
  .save();

const tearDown = () =>
  bookshelf.knex('water.licences')
    .where('is_test', true)
    .del();

exports.create = create;
exports.tearDown = tearDown;
