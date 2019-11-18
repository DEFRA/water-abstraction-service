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
   * Will return null if no batch was created which indicates that there
   * is already a batch being processed for the given region.
   *
   * @param {String} regionId The uuid value for the region
   * @param {String} batchType Whether annual, supplementary or two_part_tariff
   * @param {Number} startFinancialYear The start year for the financial year range
   * @param {Number} endFinancialYear The end year for the financial year range
   * @param {String} season Whether summer, winter or all year
   */
  async createBatch (regionId, batchType, startFinancialYear, endFinancialYear, season) {
    const query = `
      insert into water.billing_batches (region_id, batch_type, start_financial_year, end_financial_year, season, status)
      select $1, $2, $3, $4, $5, 'processing'
      where
        not exists (
          select b.billing_batch_id
          from water.billing_batches b
          where b.status = 'processing' and b.region_id = $1
        )
      returning *;
    `;

    const result = await this.dbQuery(query, [regionId, batchType, startFinancialYear, endFinancialYear, season]);
    return get(result, 'rows[0]', null);
  }

  async getById (batchId) {
    const result = await this.find({ billing_batch_id: batchId });
    return get(result, 'rows[0]', null);
  }

  /**
   * Updates the status of a batch
   * @param {String/UUID} batchId The batch id to update
   * @param {String} status The status to set [complete | error | processing]
   */
  setStatus (batchId, status) {
    return this.update(
      { billing_batch_id: batchId },
      { status, date_updated: new Date() }
    );
  }
}

module.exports = BillingBatchRepository;
