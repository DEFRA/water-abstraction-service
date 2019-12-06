const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

class BillingInvoiceLicenceRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.billing_invoice_licences',
      primaryKey: 'billing_invoice_licence_id',
      upsert: {
        fields: ['billing_invoice_id', 'company_id', 'address_id', 'licence_id'],
        set: ['date_updated']
      }
    }, config));
  }
};

module.exports = BillingInvoiceLicenceRepository;
