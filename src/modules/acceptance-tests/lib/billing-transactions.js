const { bookshelf } = require('../../../lib/connectors/bookshelf');
const { ACCEPTANCE_TEST_SOURCE } = require('./constants');

const deleteTransactionsQuery = `delete from water.billing_transactions t
using 
    water.billing_invoice_licences il,
    water.billing_invoices i
    where    
    t.billing_invoice_licence_id=il.billing_invoice_licence_id
    and il.billing_invoice_id=i.billing_invoice_id
    and i.metadata->>'source' = '${ACCEPTANCE_TEST_SOURCE}'`;

const deleteTransactions = async () => bookshelf.knex.raw(deleteTransactionsQuery);

exports.delete = deleteTransactions;
