const newRepos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');

/**
 * Loads a Batch instance by ID
 * @param {String} id - batch ID GUID
 * @return {Promise<Batch>}
 */
const getBatchById = async id => {
  const row = await newRepos.billingBatches.findOne(id);
  return mappers.batch.dbToModel(row);
};

const getBatches = async (page = 1, perPage = Number.MAX_SAFE_INTEGER) => {
  const result = await newRepos.billingBatches.findPage(page, perPage);
  return {
    data: result.data.map(mappers.batch.dbToModel),
    pagination: result.pagination
  };
};

exports.getBatchById = getBatchById;
exports.getBatches = getBatches;
