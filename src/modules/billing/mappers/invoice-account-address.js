'use strict';

const InvoiceAccountAddress = require('../../../lib/models/invoice-account-address');
const contactMapper = require('../../../lib/mappers/contact');
const companyMapper = require('./company');
const addressMapper = require('../../../lib/mappers/address');
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
    address: addressMapper.crmToModel(invoiceAccountAddress.address),
    contact: contactMapper.crmToModel(invoiceAccountAddress.contact),
    agentCompany: companyMapper.crmToModel(invoiceAccountAddress.agentCompany)
  });
};

exports.crmToModel = crmToModel;
