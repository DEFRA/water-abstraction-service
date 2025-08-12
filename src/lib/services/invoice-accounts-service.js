'use strict'

const moment = require('moment')
const promiseWaterfall = require('p-waterfall')

const InvoiceAccountAddress = require('../models/invoice-account-address')
const invoiceAccountsConnector = require('../connectors/crm-v2/invoice-accounts')
const invoiceAccountAddressesService = require('./invoice-account-addresses-service')
const companiesService = require('./companies-service')
const addressesService = require('./addresses-service')
const contactsService = require('./contacts-service')
const regionsService = require('./regions-service')
const mappers = require('../mappers')
const validators = require('../models/validators')
const { CONTACT_ROLES } = require('../models/constants')
const { logger } = require('../../logger')
const DATE_FORMAT = 'YYYY-MM-DD'

/**
 * Gets invoice accounts with specified IDs from CRM and
 * returns as an array of InvoiceAccount models
 * @param {Array<String>} ids - GUIDs for CRM invoice account IDs
 * @return {Promise<Array>}
 */
const getByInvoiceAccountIds = async (ids = []) => {
  if (ids.length === 0) {
    return []
  }

  const invoiceAccounts = await invoiceAccountsConnector.getInvoiceAccountsByIds(ids)

  return invoiceAccounts.map(invoiceAccount =>
    mappers.invoiceAccount.crmToModel(invoiceAccount)
  )
}

/**
 * Gets the invoice accounts with the specified ID from CRM and
 * returns as an InvoiceAccount model
 * @param String id - GUID for CRM invoice account ID
 * @return {Promise<InvoiceAccount>}
 */
const getByInvoiceAccountId = async id => {
  const invoiceAccount = await invoiceAccountsConnector.getInvoiceAccountById(id)
  return mappers.invoiceAccount.crmToModel(invoiceAccount)
}

const deleteInvoiceAccount = async invoiceAccount =>
  invoiceAccountsConnector.deleteInvoiceAccount(invoiceAccount.id)

/**
 * Creates a new invoice account in the CRM
 * @param {String} regionId guid
 * @param {InvoiceAccount} invoiceAccount containing data to be persisted
 */
const createInvoiceAccount = async (regionId, invoiceAccount) => {
  const { code: regionCode } = await regionsService.getRegion(regionId)
  const invoiceAccountEntity = await invoiceAccountsConnector.createInvoiceAccount({
    regionCode,
    companyId: invoiceAccount.company.id,
    startDate: invoiceAccount.dateRange.startDate
  })

  return mappers.invoiceAccount.crmToModel(invoiceAccountEntity)
}

/**
 * If an agent company is present in the invoice account address,
 * persist it to CRM if it has no ID
 *
 * @param {Object} context
 * @return {Promise<Object>} context
 */
const persistAgentCompany = async context => {
  const { agentCompany } = context.invoiceAccountAddress
  if (agentCompany && !agentCompany.id) {
    context.invoiceAccountAddress.agentCompany = await companiesService.createCompany(agentCompany)
  }
  return context
}

const getInvoiceAccountAddressCompany = context => context.invoiceAccountAddress.agentCompany || context.invoiceAccount.company

/**
 * Persist the address to the CRM if it has no ID
 * Also add it to either the licence holder or agent company as appropriate
 *
 * @param {Object} context
 * @return {Promise<Object>} context
 */
const persistAddress = async context => {
  const { address, dateRange: { startDate } } = context.invoiceAccountAddress

  // Create address in CRM
  if (!address.id) {
    context.invoiceAccountAddress.address = await addressesService.createAddress(address)
  }

  // Add address to company with "billing" role
  const company = getInvoiceAccountAddressCompany(context)
  await companiesService.createCompanyAddress(company.id, context.invoiceAccountAddress.address.id, {
    startDate,
    roleName: CONTACT_ROLES.billing
  })

  return context
}

/**
 * Persist the contact to the CRM if it has no ID
 * Also add it to either the licence holder or agent company as appropriate
 *
 * @param {Object} context
 * @return {Promise<Object>} context
 */
const persistContact = async context => {
  const { contact, dateRange: { startDate } } = context.invoiceAccountAddress

  if (contact) {
    // Create contact in CRM
    if (!contact.id) {
      context.invoiceAccountAddress.contact = await contactsService.createContact(contact)
    }

    // Add contact to company with "billing" role
    const company = getInvoiceAccountAddressCompany(context)
    await companiesService.createCompanyContact(company.id, context.invoiceAccountAddress.contact.id, {
      startDate,
      roleName: CONTACT_ROLES.billing
    })
  }

  return context
}

/**
 * If there is an existing invoice account address...
 *
 * - With null end date, set the end date
 * - With end date after new start date, set end date
 * - Same start date as new start date, delete it
 *
 * @param {Object} context
 * @return {Promise<Object>} context
 */
const updateExistingInvoiceAccountAddresses = async context => {
  const { invoiceAccount: { invoiceAccountAddresses }, invoiceAccountAddress } = context
  for (const existingInvoiceAccountAddress of invoiceAccountAddresses) {
    // Same start date - delete existing record
    if (existingInvoiceAccountAddress.dateRange.isStartDate(invoiceAccountAddress.dateRange.startDate)) {
      await invoiceAccountAddressesService.deleteInvoiceAccountAddress(existingInvoiceAccountAddress.id)
    } else if (existingInvoiceAccountAddress.dateRange.includes(invoiceAccountAddress.dateRange.startDate)) {
      // Patch end date to day before new date
      const previousDay = moment(invoiceAccountAddress.dateRange.startDate).subtract(1, 'day').format(DATE_FORMAT)
      await invoiceAccountAddressesService.setEndDate(existingInvoiceAccountAddress.id, previousDay)
    }
  }

  return context
}

const persistInvoiceAccountAddress = async context => {
  const { invoiceAccount, invoiceAccountAddress } = context
  return invoiceAccountAddressesService.createInvoiceAccountAddress(invoiceAccount, invoiceAccountAddress)
}

const createInvoiceAccountAddress = async (invoiceAccountId, invoiceAccountAddress) => {
  validators.assertId(invoiceAccountId)
  validators.assertIsInstanceOf(invoiceAccountAddress, InvoiceAccountAddress)

  // Load invoice account
  const invoiceAccount = await getByInvoiceAccountId(invoiceAccountId)

  // Create list of tasks needed to create the invoice account address
  const context = { invoiceAccount, invoiceAccountAddress }
  const tasks = [
    persistAgentCompany,
    persistAddress,
    persistContact,
    updateExistingInvoiceAccountAddresses,
    persistInvoiceAccountAddress
  ]

  try {
    return await promiseWaterfall(tasks, context)
  } catch (err) {
    logger.error('Error creating invoice account address', context)
    throw err
  }
}

/**
 * Gets the related invoice account for the supplied ChargeVersion model
 * @param {ChargeVersion} chargeVersion
 * @return {chargeVersion} decorated with invoice account
 */
const decorateWithInvoiceAccount = async model => {
  if (!model.invoiceAccount) {
    return model
  }
  const { id } = model.invoiceAccount
  const invoiceAccount = await getByInvoiceAccountId(id)
  model.invoiceAccount = invoiceAccount
  return model
}

exports.getByInvoiceAccountIds = getByInvoiceAccountIds
exports.getByInvoiceAccountId = getByInvoiceAccountId
exports.decorateWithInvoiceAccount = decorateWithInvoiceAccount
exports.deleteInvoiceAccount = deleteInvoiceAccount
exports.createInvoiceAccount = createInvoiceAccount
exports.createInvoiceAccountAddress = createInvoiceAccountAddress
