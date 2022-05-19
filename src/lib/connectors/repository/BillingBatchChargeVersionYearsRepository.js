const Repository = require('@envage/hapi-pg-rest-api/src/repository')
const db = require('../db')

class BillingBatchChargeVersionYearsRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.billing_batch_charge_version_years',
      primaryKey: 'billing_batch_charge_version_year_id'
    }, config))
  }
}

module.exports = BillingBatchChargeVersionYearsRepository
