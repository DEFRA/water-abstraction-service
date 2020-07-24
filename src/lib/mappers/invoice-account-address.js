'use strict';

const InvoiceAccountAddress = require('../models/invoice-account-address');

const { address, company, contact } = require('../mappers');
const DateRange = require('../models/date-range');

/**
 * Maps CRM invoice account and (optionally) company data to a water service model
 * @param {Object} invoiceAccount - CRM invoice account data
 * @param {Object} company - CRM company data
 * @return {InvoiceAccount}
 */
const crmToModel = invoiceAccountAddress => {
  const model = new InvoiceAccountAddress(invoiceAccountAddress.invoiceAccountAddressId);
  model.fromHash({
    dateRange: new DateRange(invoiceAccountAddress.startDate, invoiceAccountAddress.endDate),
    invoiceAccountId: invoiceAccountAddress.invoiceAccountId,
    address: address.crmToModel(invoiceAccountAddress.address),
    agentCompany: company.crmToModel(invoiceAccountAddress.agentCompany),
    contact: contact.crmToModel(invoiceAccountAddress.contact)
  });

  return model;
};

exports.crmToModel = crmToModel;
