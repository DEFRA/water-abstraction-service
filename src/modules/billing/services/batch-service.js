const Batch = require('../../../lib/models/batch');
const repos = require('../../../lib/connectors/repository');
const FinancialYear = require('../../../lib/models/financial-year');

const mapDBToModel = row => {
  const batch = new Batch();
  batch.fromHash({
    id: row.billing_batch_id,
    type: row.batch_type,
    season: row.season,
    startYear: new FinancialYear(row.from_financial_year_ending),
    endYear: new FinancialYear(row.to_financial_year_ending),
    status: row.status
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

exports.mapDBToModel = mapDBToModel;
exports.getBatchById = getBatchById;
