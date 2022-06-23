const addressService = require('./addresses-service')
const companiesService = require('./companies-service')
const contactsService = require('./contacts-service')
const invoiceAccountsService = require('./invoice-accounts-service')
const invoiceAccountAddressesService = require('./invoice-account-addresses-service')

const { reverse } = require('lodash')

const entitiesConfig = {
  Address: addressService.deleteAddress,
  Company: companiesService.deleteCompany,
  Contact: contactsService.deleteContact,
  CompanyAddress: companiesService.deleteCompanyAddress,
  CompanyContact: companiesService.deleteCompanyContact,
  InvoiceAccount: invoiceAccountsService.deleteInvoiceAccount,
  InvoiceAccountAddress: invoiceAccountAddressesService.deleteInvoiceAccountAddress
}

const deleteEntities = async entities => {
  for (const entity of reverse(entities)) {
    await entitiesConfig[entity.constructor.name](entity)
  }
}

exports.deleteEntities = deleteEntities
