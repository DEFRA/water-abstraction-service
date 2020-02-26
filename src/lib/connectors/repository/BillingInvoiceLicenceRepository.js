const { get } = require('lodash');
const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

const findOneByTransactionIdQuery = `
  select il.*, l.is_water_undertaker, l.regions
  from water.billing_transactions t
    join water.billing_invoice_licences il
      on t.billing_invoice_licence_id=il.billing_invoice_licence_id
    join water.licences l
      on il.licence_id=l.licence_id
  where t.billing_transaction_id=$1;
`;

const deleteByBatchIdQuery = `
  delete from water.billing_invoice_licences il
  using water.billing_invoices i
  where i.billing_invoice_id = il.billing_invoice_id
  and i.billing_batch_id = $1;
`;

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

  /**
   * Find a single invoice licence by transaction ID that references it
   * @param {String} transactionId
   * @return {Promise<Object>}
   */
  async findOneByTransactionId (transactionId) {
    const result = await this.dbQuery(findOneByTransactionIdQuery, [transactionId]);
    return get(result, 'rows.0', null);
  }

  /**
   * Deletes all invoice licence records from water.billing_invoice_licences
   * that are associated with the batch specified in the parameters.
   *
   * @param {String} batchId UUID of the batch containing the invoice licences to delete
   */
  deleteByBatchId (batchId) {
    return this.dbQuery(deleteByBatchIdQuery, [batchId]);
  }
};

module.exports = BillingInvoiceLicenceRepository;
module.exports._findOneByTransactionIdQuery = findOneByTransactionIdQuery;
