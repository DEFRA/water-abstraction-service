const { Region, bookshelf } = require('../../../src/lib/connectors/bookshelf');

const Regions = bookshelf.collection('Regions', {
  model: Region
});

const data = require('./data');

/**
 * Creates a test region, which otherwise behaves as Anglian
 * @return {Promise}
 */
const createTestRegion = () => Region
  .forge({
    isTest: true,
    ...data.regions.testRegion
  })
  .save();

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
const tearDown = () =>
  bookshelf.knex('water.regions')
    .where('is_test', true)
    .del();

exports.createTestRegion = createTestRegion;
exports.getTestRegionIds = getTestRegionIds;
exports.tearDown = tearDown;
