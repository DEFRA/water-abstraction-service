const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

class BillingBatchChargeVersionsRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.billing_batch_charge_versions',
      primaryKey: 'billing_batch_charge_version_id'
    }, config));
  }

  deleteByBatchId (batchId) {
    return this.delete({
      billing_batch_id: batchId
    });
  }
}

module.exports = BillingBatchChargeVersionsRepository;
