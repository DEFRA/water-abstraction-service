const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

class BillingBatchRepository extends Repository {
  constructor (config = {}) {
    const mergedConfig = {
      connection: db.pool,
      table: 'water.billing_batches',
      primaryKey: 'billing_batch_id'
    };
    super(mergedConfig);
  }

  /**
   * Creates a new batch record in the water.billing_batches table
   *
   * @param {String} regionId The uuid value for the region
   * @param {String} batchType Whether annual, supplementary or two_part_tariff
   * @param {Number} financialYear The financial year
   * @param {String} season Whether summer, winter or all year
   */
  createBatch (regionId, batchType, financialYear, season) {
    return this.create({
      region_id: regionId,
      batch_type: batchType,
      financial_year: financialYear,
      season
    });
  }
}

module.exports = BillingBatchRepository;
