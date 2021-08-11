const { bookshelf } = require('../../../src/lib/connectors/bookshelf');
const { ACCEPTANCE_TEST_SOURCE } = require('../../../src/modules/acceptance-tests/lib/constants');

const deleteInvoicesQuery = `
  delete from 
  water.billing_invoices
  where metadata->>'source' = '${ACCEPTANCE_TEST_SOURCE}'`;

const deleteInvoices = async () => bookshelf.knex.raw(deleteInvoicesQuery);

exports.delete = deleteInvoices;
