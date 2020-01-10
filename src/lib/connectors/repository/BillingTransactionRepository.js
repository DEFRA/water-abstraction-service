const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

const deleteByInvoiceAccountQuery = `
  delete
  from water.billing_transactions tx
    using water.billing_invoice_licences il, water.billing_invoices i
  where il.billing_invoice_licence_id = tx.billing_invoice_licence_id
    and i.billing_invoice_id = il.billing_invoice_id
    and i.billing_batch_id = $1
    and i.invoice_account_id = $2;
`;

class BillingTransactionRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.billing_transactions',
      primaryKey: 'billing_transaction_id'
    }, config));
  }

  /**
   * Deletes all transactions from water.billing_transactions that are associated
   * with the batch and invoice account specified in the parameters.
   *
   * @param {String} batchId UUID of the batch containing the transactions to delete
   * @param {String} invoiceAccountId UUID of the account for which to delete all transactions
   */
  deleteByInvoiceAccount (batchId, invoiceAccountId) {
    return this.dbQuery(deleteByInvoiceAccountQuery, [batchId, invoiceAccountId]);
  }
}

module.exports = BillingTransactionRepository;
