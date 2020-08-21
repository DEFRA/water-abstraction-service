'use strict';

const InvoiceAccountAddress = require('../models/invoice-account-address');

const { address, company, contact } = require('../mappers');
const DateRange = require('../models/date-range');
const Company = require('../models/company');
const Address = require('../models/address');
const Contact = require('../models/contact-v2');

/**
 * Maps CRM invoice account and (optionally) company data to a water service model
 * @param {Object} invoiceAccount - CRM invoice account data
 * @param {Object} company - CRM company data
 * @return {InvoiceAccount}
 */
const crmToModel = invoiceAccountAddress => {
  const model = new InvoiceAccountAddress(invoiceAccountAddress.invoiceAccountAddressId);

  model.dateRange = new DateRange(invoiceAccountAddress.startDate, invoiceAccountAddress.endDate);
  model.invoiceAccountId = invoiceAccountAddress.invoiceAccountId;

  if (invoiceAccountAddress.address) {
    model.address = address.crmToModel(invoiceAccountAddress.address);
  } else {
    model.address = new Address(invoiceAccountAddress.addressId);
  }
  // add the Agent company if there is one otherwise add an empty company model
  if (invoiceAccountAddress.agentCompany) {
    model.agentCompany = company.crmToModel(invoiceAccountAddress.agentCompany);
  } else if (invoiceAccountAddress.agentCompanyId) {
    model.agentCompany = new Company(invoiceAccountAddress.agentCompanyId);
  } else { model.agentCompany = new Company(); }

  // add the contact if there is one otherwise add an empty contact model
  if (invoiceAccountAddress.contact) {
    model.contact = contact.crmToModel(invoiceAccountAddress.contact);
  } else if (invoiceAccountAddress.contactId) {
    model.contact = new Contact(invoiceAccountAddress.contactId);
  } else { model.contact = new Contact(); }
  return model;
};

exports.crmToModel = crmToModel;
