'use strict';

const InvoiceAccountAddress = require('../models/invoice-account-address');

const { address, company, contact } = require('../mappers');
const DateRange = require('../models/date-range');
const Address = require('../models/address');
const Company = require('../models/company');
const Contact = require('../models/contact');

/**
 * Maps CRM invoice account and (optionally) company data to a water service model
 * @param {Object} invoiceAccount - CRM invoice account data
 * @return {InvoiceAccount}
 */
const crmToModel = invoiceAccountAddress => {
  const model = new InvoiceAccountAddress(invoiceAccountAddress.invoiceAccountAddressId);

  model.dateRange = new DateRange(invoiceAccountAddress.startDate, invoiceAccountAddress.endDate);
  model.invoiceAccountId = invoiceAccountAddress.invoiceAccountId;

  if (invoiceAccountAddress.address) {
    model.address = address.crmToModel(invoiceAccountAddress.address);
  } else if (invoiceAccountAddress.addressId) {
    model.address = new Address(invoiceAccountAddress.addressId);
  }

  if (invoiceAccountAddress.contact) {
    model.contact = contact.crmToModel(invoiceAccountAddress.contact);
  } else if (invoiceAccountAddress.contactId) {
    model.contact = new Contact(invoiceAccountAddress.contactId);
  }

  if (invoiceAccountAddress.agentCompany) {
    model.agentCompany = company.crmToModel(invoiceAccountAddress.agentCompany);
  } else if (invoiceAccountAddress.agentCompanyId) {
    model.agentCompany = new Company(invoiceAccountAddress.agentCompanyId);
  }

  return model;
};

exports.crmToModel = crmToModel;
