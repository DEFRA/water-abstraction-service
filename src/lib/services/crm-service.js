const addressService = require('./addresses-service')
const companiesService = require('./companies-service')
const contactsService = require('./contacts-service')
const invoiceAccountsService = require('./invoice-accounts-service')
const invoiceAccountAddressesService = require('./invoice-account-addresses-service')

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
  const reversedEntities = entities.reverse()
  for (const entity of reversedEntities) {
    await entitiesConfig[entity.constructor.name](entity)
  }
}

exports.deleteEntities = deleteEntities
