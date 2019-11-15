const { get } = require('lodash');
const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

class BillingBatchRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.billing_batches',
      primaryKey: 'billing_batch_id'
    }, config));
  }

  /**
   * Creates a new batch record in the water.billing_batches table
   *
   * @param {String} regionId The uuid value for the region
   * @param {String} batchType Whether annual, supplementary or two_part_tariff
   * @param {Number} startFinancialYear The start year for the financial year range
   * @param {Number} endFinancialYear The end year for the financial year range
   * @param {String} season Whether summer, winter or all year
   */
  createBatch (regionId, batchType, startFinancialYear, endFinancialYear, season) {
    return this.create({
      region_id: regionId,
      batch_type: batchType,
      start_financial_year: startFinancialYear,
      end_financial_year: endFinancialYear,
      season
    });
  }

  async getById (batchId) {
    const result = await this.find({ billing_batch_id: batchId });
    return get(result, 'rows[0]', null);
  }
}

module.exports = BillingBatchRepository;
