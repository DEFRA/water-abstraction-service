const { bookshelf } = require('../../../src/lib/connectors/bookshelf');
const { ACCEPTANCE_TEST_SOURCE } = require('../../../src/modules/acceptance-tests/lib/constants');

const deleteInvoiceLicencesQuery = `delete from water.billing_invoice_licences il
using 
    water.billing_invoices i
  where    
    il.billing_invoice_id=i.billing_invoice_id
    and i.metadata->>'source' = '${ACCEPTANCE_TEST_SOURCE}'`;

const deleteInvoiceLicences = async () => bookshelf.knex.raw(deleteInvoiceLicencesQuery);

exports.delete = deleteInvoiceLicences;
