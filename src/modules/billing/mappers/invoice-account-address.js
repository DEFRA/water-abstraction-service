'use strict';

const InvoiceAccountAddress = require('../../../lib/models/invoice-account-address');

const company = require('./company');
const address = require('./address');
const contact = require('./contact');
const DateRange = require('../../../lib/models/date-range');

/**
 * Maps CRM invoice account and (optionally) company data to a water service model
 * @param {Object} invoiceAccount - CRM invoice account data
 * @param {Object} company - CRM company data
 * @return {InvoiceAccount}
 */
const crmToModel = invoiceAccountAddress => {
  const model = new InvoiceAccountAddress(invoiceAccountAddress.invoiceAccountAddressId);
  return model.fromHash({
    dateRange: new DateRange(invoiceAccountAddress.startDate, invoiceAccountAddress.endDate),
    address: address.crmToModel(invoiceAccountAddress.address),
    contact: contact.crmToModel(invoiceAccountAddress.contact),
    agentCompany: company.crmToModel(invoiceAccountAddress.agentCompany)
  });
};

exports.crmToModel = crmToModel;
