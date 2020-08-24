'use strict';

const InvoiceAccountAddress = require('../models/invoice-account-address');

const { address, company, contact } = require('../mappers');
const DateRange = require('../models/date-range');
const Company = require('../models/company');
const { has } = require('lodash');

/**
 * Maps CRM invoice account and (optionally) company data to a water service model
 * @param {Object} invoiceAccount - CRM invoice account data
 * @return {InvoiceAccount}
 */
const crmToModel = invoiceAccountAddress => {
  const model = new InvoiceAccountAddress(invoiceAccountAddress.invoiceAccountAddressId);

  model.dateRange = new DateRange(invoiceAccountAddress.startDate, invoiceAccountAddress.endDate);
  model.invoiceAccountId = invoiceAccountAddress.invoiceAccountId;
  model.address = address.crmToModel(has(invoiceAccountAddress, 'address') ? invoiceAccountAddress.address : invoiceAccountAddress);
  model.contact = contact.crmToModel(has(invoiceAccountAddress, 'contact') ? invoiceAccountAddress.contact : invoiceAccountAddress);

  if (invoiceAccountAddress.agentCompany) {
    model.agentCompany = company.crmToModel(invoiceAccountAddress.agentCompany);
  } else if (invoiceAccountAddress.agentCompanyId) {
    model.agentCompany = new Company(invoiceAccountAddress.agentCompanyId);
  } else { model.agentCompany = new Company(); }

  return model;
};

exports.crmToModel = crmToModel;
