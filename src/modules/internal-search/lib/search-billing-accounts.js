const invoiceAccounts = require('../../../lib/connectors/crm-v2/invoice-accounts');

/*
 * Search billing accounts in CRM
 * @param  {String} query - the search term
 * @return {Promise}      - responds with API response
 */
const searchBillingAccounts = query => invoiceAccounts.getInvoiceAccountByRef(query);

module.exports = {
  searchBillingAccounts
};
