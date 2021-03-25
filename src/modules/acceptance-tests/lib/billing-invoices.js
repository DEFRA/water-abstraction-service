const { bookshelf } = require('../../../lib/connectors/bookshelf');
const { ACCEPTANCE_TEST_SOURCE } = require('./constants');

const deleteInvoicesQuery = `
  delete from 
  water.billing_invoices
  where metadata->>'source' = '${ACCEPTANCE_TEST_SOURCE}'`;

const deleteInvoices = async () => bookshelf.knex.raw(deleteInvoicesQuery);

exports.delete = deleteInvoices;
