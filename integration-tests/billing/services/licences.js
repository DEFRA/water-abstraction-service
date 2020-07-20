const data = require('./data');
const { Licence, bookshelf } = require('../../../src/lib/connectors/bookshelf');
const { omit } = require('lodash');

let cache = {};

/**
 * Create the test licence in the region with the specified
 * @param {Object} region
 * @param {String} scenarioKey
 */
const create = async (region, scenarioKey) => {
  if (!cache[scenarioKey]) {
    const licence = await Licence
      .forge({
        isTest: true,
        regionId: region.get('regionId'),
        ...omit(data.licences[scenarioKey], 'documents')
      })
      .save();

    cache[scenarioKey] = licence;
  }
  return cache[scenarioKey];
};

const tearDown = () => {
  cache = {};

  return bookshelf.knex('water.licences')
    .where('is_test', true)
    .del();
};

exports.create = create;
exports.tearDown = tearDown;
