const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

class BillingBatchChargeVersionYearsRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.billing_batch_charge_version_years',
      primaryKey: 'billing_batch_charge_version_year_id'
    }, config));
  }

  setStatus (id, status) {
    return this.update(
      { billing_batch_charge_version_year_id: id },
      { status, date_updated: new Date() }
    );
  }

  /**
   * Finds all rows in the water.billing_batch_charge_version_years table for
   * a given billing_batch_id where the status is 'processing'
   *
   * @param {String} batchId The billing_batch_id value
   */
  findProcessingByBatch (batchId) {
    return this.find({
      billing_batch_id: batchId,
      status: 'processing'
    });
  }
}

module.exports = BillingBatchChargeVersionYearsRepository;
