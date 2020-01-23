const Batch = require('../../../lib/models/batch');
const Region = require('../../../lib/models/region');
const repos = require('../../../lib/connectors/repository');
const FinancialYear = require('../../../lib/models/financial-year');
const regionsService = require('./regions-service');

const mapDBToModel = row => {
  const batch = new Batch();
  batch.fromHash({
    id: row.billing_batch_id,
    type: row.batch_type,
    season: row.season,
    startYear: new FinancialYear(row.from_financial_year_ending),
    endYear: new FinancialYear(row.to_financial_year_ending),
    status: row.status,
    dateCreated: row.date_created,
    region: regionsService.mapDBToModel(row.region)
  });
  return batch;
};

/**
 * Loads a Batch instance by ID
 * @param {String} id - batch ID GUID
 * @return {Promise<Batch>}
 */
const getBatchById = async id => {
  const row = await repos.billingBatches.getById(id);
  return mapDBToModel(row);
};

const getBatches = async (page = 1, perPage = Number.MAX_SAFE_INTEGER) => {
  const pagination = { page, perPage };
  const { rows } = await repos.billingBatches.find(null, { date_created: -1 }, pagination);
  const batches = rows.map(mapDBToModel);

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

exports.mapDBToModel = mapDBToModel;
exports.getBatchById = getBatchById;
exports.getBatches = getBatches;
