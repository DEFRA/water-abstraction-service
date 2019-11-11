const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

class BillingTransactionRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.billing_transactions',
      primaryKey: 'billing_transaction_id'
    }, config));
  }
}

module.exports = BillingTransactionRepository;
