'use strict';
const { truncate } = require('lodash');
const invoiceAccountMapper = require('../../lib/mappers/invoice-account');

/**
 * @module maps service models to charge module expected schema
 */

/**
 * Maps the invoice account model to what the charge module expects
 * for a customer record
 * @param {Object} invoiceAccount modelled object
 * @return {Object} mapped customer object
 */
const mapInvoiceAccountToChargeModuleCustomer = async invoiceAccount => {
  console.log(invoiceAccount);
  const mappedInvoiceAccount = await invoiceAccountMapper.crmToModel(invoiceAccount);
  const { lastInvoiceAccountAddress, company } = mappedInvoiceAccount;
  const { address, agentCompany } = lastInvoiceAccountAddress;
  const parsedAddress = extractAddress(address);
  const response = {
    region: mappedInvoiceAccount.accountNumber.charAt(0), // Region code is always assumed to be the first letter of the account number,
    customerReference: mappedInvoiceAccount.accountNumber,
    customerName: extractCustomerName(agentCompany, company),
    ...parsedAddress
  };
  return response;
};

const extractAddress = address => {
  /**
   * Below is the CM expected schema, for reference
   *   region: regionValidator.required(),
   *   customerReference: customerReferenceValidator.required(),
   *   customerName: stringValidator.max(360).required(),
   *   addressLine1: stringValidator.max(240).required(),
   *   addressLine2: stringValidator.max(240).allow('', null),
   *   addressLine3: stringValidator.max(240).allow('', null),
   *   addressLine4: stringValidator.max(240).allow('', null),
   *   addressLine5: stringValidator.max(60).allow('', null),
   *   addressLine6: stringValidator.max(60).allow('', null),
   *   postcode: stringValidator.max(60).allow('', null)
   */
  return {
    addressLine1: truncate(address.addressLine1, { length: 360 }),
    addressLine2: truncate(address.addressLine2, { length: 240 }),
    addressLine3: truncate(address.addressLine3, { length: 240 }),
    addressLine4: truncate(address.addressLine4, { length: 240 }),
    addressLine5: truncate(address.town, { length: 60 }),
    addressLine6: truncate(
      address.county ? `${address.county}, ${address.country}` : address.country
      , { length: 60 }),
    postcode: truncate(address.postcode, { length: 60 })
  };
};
const extractCustomerName = (agentCompany, company) => {
  let fao;
  const companyName = agentCompany.name ? agentCompany.name : company.name;

  if (companyName === agentCompany.name) {
    fao = extractFAO(agentCompany);
  } else if (companyName === company.name) {
    fao = extractFAO(company);
  }

  return fao ? `FAO ${fao}, ${companyName}` : companyName;
};
const extractFAO = company => {
  if (company.companyContacts.length > 0) {
    return company.companyContacts.find(contact => contact.name).name;
  }
  return null;
};

exports.mapInvoiceAccountToChargeModuleCustomer = mapInvoiceAccountToChargeModuleCustomer;
exports.extractCustomerName = extractCustomerName;
exports.extractFAO = extractFAO;
exports.extractAddress = extractAddress;
