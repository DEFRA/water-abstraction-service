'use strict'

const InvoiceAccountAddress = require('../models/invoice-account-address')
const DateRange = require('../models/date-range')
const Address = require('../models/address')
const Company = require('../models/company')
const Contact = require('../models/contact-v2')

const dateRangeMapper = require('./date-range')
const addressMapper = require('./address')
const companyMapper = require('./company')
const contactMapper = require('./contact')

const { createMapper } = require('../object-mapper')
const { createModel } = require('./lib/helpers')

const setModelAddress = (model, invoiceAccountAddress) => {
  if (invoiceAccountAddress.address) {
    model.address = addressMapper.crmToModel(invoiceAccountAddress.address)
  } else if (invoiceAccountAddress.addressId) {
    model.address = new Address(invoiceAccountAddress.addressId)
  }
}

const setModelContact = (model, invoiceAccountAddress) => {
  if (invoiceAccountAddress.contact) {
    model.contact = contactMapper.crmToModel(invoiceAccountAddress.contact)
  } else if (invoiceAccountAddress.contactId) {
    model.contact = new Contact(invoiceAccountAddress.contactId)
  }
}

const setModelAgentCompany = (model, invoiceAccountAddress) => {
  if (invoiceAccountAddress.agentCompany) {
    model.agentCompany = companyMapper.crmToModel(invoiceAccountAddress.agentCompany)
  } else if (invoiceAccountAddress.agentCompanyId) {
    model.agentCompany = new Company(invoiceAccountAddress.agentCompanyId)
  }
}

/**
 * Maps CRM invoice account and (optionally) company data to a water service model
 * @param {Object} invoiceAccount - CRM invoice account data
 * @return {InvoiceAccount}
 */
const crmToModel = invoiceAccountAddress => {
  const model = new InvoiceAccountAddress(invoiceAccountAddress.invoiceAccountAddressId)

  model.dateRange = new DateRange(invoiceAccountAddress.startDate, invoiceAccountAddress.endDate)
  model.invoiceAccountId = invoiceAccountAddress.invoiceAccountId

  setModelAddress(model, invoiceAccountAddress)
  setModelContact(model, invoiceAccountAddress)
  setModelAgentCompany(model, invoiceAccountAddress)

  return model
}

const pojoToModelMapper = createMapper()
  .copy(
    'id',
    'invoiceAccountId'
  )
  .map('dateRange').to('dateRange', dateRangeMapper.pojoToModel)
  .map('address').to('address', addressMapper.pojoToModel)
  .map('contact').to('contact', contactMapper.pojoToModel)
  .map('agentCompany').to('agentCompany', companyMapper.pojoToModel)

/**
 * Converts a plain object representation of a InvoiceAccountAddress to a InvoiceAccountAddress model
 * @param {Object} pojo
 * @return InvoiceAccountAddress
 */
const pojoToModel = pojo => createModel(InvoiceAccountAddress, pojo, pojoToModelMapper)

exports.crmToModel = crmToModel
exports.pojoToModel = pojoToModel
