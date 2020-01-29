const repos = require('../../../lib/connectors/repository');
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
  const pagination = { page, perPage };
  const { rows } = await repos.billingBatches.find(null, { date_created: -1 }, pagination);
  const batches = rows.map(mappers.batch.dbToModel);

  const { rows: [totalRowCount] } = await repos.billingBatches.findRowCount();
  const totalRows = totalRowCount.totalrowcount;
  return {
    data: batches,
    pagination: {
      page,
      perPage,
      totalRows,
      pageCount: Math.ceil(totalRows / perPage)
    }
  };
};

exports.getBatchById = getBatchById;
exports.getBatches = getBatches;
