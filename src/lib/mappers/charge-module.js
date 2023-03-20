'use strict'
const { truncate } = require('lodash')
const { combineAddressLines, getAddressObjectFromArray } = require('./lib/helpers')

/**
 * @module maps service models to charge module expected schema
 */

/**
 * Maps the invoice account model to what the charge module expects
 * for a customer record
 * @param {Object} invoiceAccount modelled object
 * @return {Object} mapped customer object
 */
const mapInvoiceAccountToChargeModuleCustomer = invoiceAccount => {
  const { lastInvoiceAccountAddress, company } = invoiceAccount
  if (!lastInvoiceAccountAddress) {
    return new Error('Could not retrieve lastInvoiceAccountAddress')
  }
  const { address, agentCompany } = lastInvoiceAccountAddress
  const customerName = extractCustomerName(company, agentCompany)
  const fao = extractFAO(lastInvoiceAccountAddress)

  const parsedAddress = extractAddress(address, fao)

  return {
    region: invoiceAccount.accountNumber.charAt(0), // Region code is always assumed to be the first letter of the account number,
    customerReference: invoiceAccount.accountNumber,
    customerName,
    ...parsedAddress
  }
}

const extractAddress = (address, fao = null) => {
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

  /* In order to determine whether the FAO line should be on address line 1
    *  on its own, or if it should be merged into an existing address line and
    *  concatenated with a comma, the FAO and the address lines are smoshed into
    */

  const lines = []
  if (fao) {
    lines.push(`FAO ${fao}`)
  }
  const { addressLine1, addressLine2, addressLine3, addressLine4 } = address
  // Filters out any falsey values
  const addressLines = [addressLine1, addressLine2, addressLine3, addressLine4].filter(a => a)

  lines.push(...addressLines)

  const arr = combineAddressLines(lines, 4)

  const parsedAddress = getAddressObjectFromArray(arr, 'addressLine')

  const response = {}

  for (const [key, value] of Object.entries(parsedAddress)) {
    response[key] = truncate(value, { length: 240 })
  }

  let line6 = ''
  if (address.county && address.country) {
    line6 = `${address.county}, ${address.country}`
  } else {
    if (address.county) {
      line6 = address.county
    } else {
      line6 = address.country
    }
  }

  response.addressLine5 = truncate(address.town, { length: 60 })
  response.addressLine6 = truncate(line6, { length: 60 })
  response.postcode = truncate(address.postcode, { length: 60 })

  return response
}

const extractCustomerName = (company = {}, agentCompany = {}) => agentCompany.name ? agentCompany.name : company.name

const extractFAO = invoiceAccount => {
  if (invoiceAccount.contact) {
    return invoiceAccount.contact.fullName
  } else {
    return null
  }
}

exports.mapInvoiceAccountToChargeModuleCustomer = mapInvoiceAccountToChargeModuleCustomer
exports.extractCustomerName = extractCustomerName
exports.extractFAO = extractFAO
exports.extractAddress = extractAddress
