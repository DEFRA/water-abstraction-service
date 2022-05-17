const objectMapper = require('object-mapper');

const getIsWaterUndertaker = invoiceLicence =>
  invoiceLicence.licence.isWaterUndertaker;

const containsWaterUndertaker = invoiceLicences => {
  return invoiceLicences
    .map(getIsWaterUndertaker)
    .includes(true);
};

const nullToEmpty = (val) => val === null ? '' : val;
const buildName = (name) => `${nullToEmpty(name.salutation)} ${nullToEmpty(name.firstName)} ${nullToEmpty(name.middleInitials)} ${nullToEmpty(name.lastName)}`;

const createCompanyContact = (companyContact) => {
  const contact = {};
  if (companyContact) {
    companyContact.forEach((val) => {
      contact[val.role.name] = buildName(val.contact);
    });
  }
  return contact;
};

const map = {
  id: 'id',
  'invoiceAccount.accountNumber': 'accountNumber',
  'invoiceAccount.company.name': 'name',
  netTotal: 'netTotal',
  'invoiceLicences[].licence.licenceNumber': 'licenceNumbers[]',
  'financialYear.yearEnding': 'financialYearEnding',
  invoiceLicences: {
    key: 'isWaterUndertaker',
    transform: containsWaterUndertaker
  },
  hasTransactionErrors: 'hasTransactionErrors',
  'invoiceAccount.company.companyContact[]': [
    {
      key: 'billingContact.roleContact',
      transform: (companyContact) => createCompanyContact(companyContact)
    }
  ],
  'agentCompany.name': 'billingContact.agentCompanyName',
  contact: {
    key: 'faoContact',
    transform: (contact) => contact ? buildName(contact) : null
  }
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
