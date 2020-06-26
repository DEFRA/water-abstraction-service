const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

const getByBatchIdQuery = `
select t.*
from water.billing_batches b
join water.billing_invoices i on b.billing_batch_id=i.billing_batch_id
join water.billing_invoice_licences l on i.billing_invoice_id=l.billing_invoice_id
join water.billing_transactions t on l.billing_invoice_licence_id=t.billing_invoice_licence_id
where b.billing_batch_id=$1
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
   * Gets a list of all transactions from water.billing_transactions
   * in the supplied batch
   * @param {String} batchId - water.billing_batches.billing_batch_id
   * @return {Promise<Array>}
   */
  async getByBatchId (batchId) {
    const { rows } = await this.dbQuery(getByBatchIdQuery, [batchId]);
    return rows;
  }

  /**
   * Sets status, optionally with external ID
   * @param {String} transactionId - GUID
   * @param {String} status - one of the statuses defined in the Transaction model
   * @param {String} externalId - GUID
   * @return {Promise}
   */
  setStatus (transactionId, status, externalId) {
    const filter = { billing_transaction_id: transactionId };
    const data = {
      status,
      ...(externalId && { external_id: externalId })
    };
    return this.update(filter, data);
  }
}

module.exports = BillingTransactionRepository;
module.exports._getByBatchIdQuery = getByBatchIdQuery;
