const objectMapper = require('object-mapper');

const getIsWaterUndertaker = invoiceLicence =>
  invoiceLicence.licence.isWaterUndertaker;

const containsWaterUndertaker = invoiceLicences => {
  return invoiceLicences
    .map(getIsWaterUndertaker)
    .includes(true);
};

const nullToEmpty = (val) => val === null ? '' : val;

const createCompanyContact = (companyContact) => {
  let contact = null;
  if (companyContact) {
    companyContact.forEach((val) => {
      contact = `${nullToEmpty(val.salutation)} ${nullToEmpty(val.firstName)} ${nullToEmpty(val.middleInitials)} ${nullToEmpty(val.lastName)}`;
    });
  }
  return contact;
};

const map = {
  id: 'id',
  'invoiceAccount.accountNumber': 'accountNumber',
  'invoiceAccount.company.name': 'name',
  'invoiceAccount.company.companyContact[].contact': [
    {
      key: 'billingContact.companyContact',
      transform: (companyContact) => createCompanyContact(companyContact)
    }
  ],
  'agentCompany.name': 'billingContact.agentCompanyName',
  netTotal: 'netTotal',
  'invoiceLicences[].licence.licenceNumber': 'licenceNumbers[]',
  'financialYear.yearEnding': 'financialYearEnding',
  invoiceLicences: {
    key: 'isWaterUndertaker',
    transform: containsWaterUndertaker
  },
  hasTransactionErrors: 'hasTransactionErrors'
};

/**
 * Maps an invoice to the API invoice list view
 * @param {Invoice} invoice
 * @return {Object}
 */
const modelToBatchInvoice = invoice => {
  return objectMapper(invoice, map);
};

exports.modelToBatchInvoices = modelToBatchInvoice;
