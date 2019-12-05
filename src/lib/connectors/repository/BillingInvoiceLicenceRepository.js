const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

class BillingInvoiceLicenceRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.billing_invoice_licences',
      primaryKey: 'billing_invoice_licence_id'
    }, config));
  }
};

module.exports = BillingInvoiceLicenceRepository;
