const { Region, bookshelf } = require('../../../src/lib/connectors/bookshelf');

const Regions = bookshelf.collection('Regions', {
  model: Region
});

const data = require('./data');
let cache = {};

/**
 * Creates a test region, which otherwise behaves as Anglian
 * @return {Promise}
 */
const createTestRegion = async () => {
  const { chargeRegionId } = data.regions.testRegion;

  if (!cache[chargeRegionId]) {
    const region = await Region.forge({
      isTest: true,
      ...data.regions.testRegion
    })
      .save();

    cache[chargeRegionId] = region;
  }
  return cache[chargeRegionId];
};

/**
 * Gets region id(s) for any test regions
 * @return {Promise<Array>}
 */
const getTestRegionIds = async () => {
  const collection = await Regions
    .where('is_test', true)
    .fetch();
  return collection.pluck('regionId');
};

/**
 * Delete regions specified
 * @param {Array} ids
 * @return {Promise}
 */
const tearDown = () => {
  cache = {};

  return bookshelf.knex('water.regions')
    .where('is_test', true)
    .del();
};

exports.createTestRegion = createTestRegion;
exports.getTestRegionIds = getTestRegionIds;
exports.tearDown = tearDown;
