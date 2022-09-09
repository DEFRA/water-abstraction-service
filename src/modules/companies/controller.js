'use strict'

const returnsConnector = require('../../lib/connectors/returns')
const documentsConnector = require('../../lib/connectors/crm/documents')
const companyContactsService = require('../../lib/services/company-contacts')

const documentsHelper = require('./lib/documents')
const returnsHelper = require('./lib/returns')
const companiesService = require('../../lib/services/companies-service')
const invoiceAccountsService = require('../../lib/services/invoice-accounts-service')
const { logger } = require('../../logger')

const invoiceAccountMapper = require('../../lib/mappers/invoice-account')

const mapErrorResponse = require('../../lib/map-error-response')

const rowMapper = ret => {
  const { purposes = [] } = ret.metadata
  return {
    licenceNumber: ret.licence_ref,
    returnId: ret.return_id,
    startDate: ret.start_date,
    endDate: ret.end_date,
    frequency: ret.returns_frequency,
    returnRequirement: ret.return_requirement,
    status: ret.status,
    siteDescription: ret.metadata.description,
    purposes: purposes.map(purpose => {
      return purpose.alias || purpose.tertiary.description
    })
  }
}

/**
 * Gets all returns for a company
 */
const getReturns = async (request, h) => {
  const { entityId } = request.params

  // Get documents for the supplied company entity
  const documentsFilter = documentsHelper.createDocumentsFilter(entityId)
  const documents = await documentsConnector.findAll(documentsFilter)

  // Get returns matching the documents and other filter params supplied
  // in request GET params
  const returnsFilter = returnsHelper.createReturnsFilter(request, documents)
  const columms = [
    'return_id', 'licence_ref', 'start_date', 'end_date',
    'returns_frequency', 'return_requirement', 'status', 'metadata'
  ]
  const returns = await returnsConnector.returns.findAll(returnsFilter, null, columms)

  // Map returns
  return returns.map(rowMapper)
}

/**
 * Gets a company for the specified ID
 */
const getCompany = async (request, h) => {
  try {
    return companiesService.getCompany(request.params.companyId)
  } catch (err) {
    return mapErrorResponse(err)
  }
}

/**
 * Gets an array of companies by name, with a soft search option
 * @param {String} name
 * @param {boolean} soft
 * */
const searchCompaniesByName = async (request, h) => {
  try {
    return companiesService.searchCompaniesByName(request.query.name, request.query.soft)
  } catch (err) {
    return mapErrorResponse(err)
  };
}

/**
 * Gets all addresses for a company
 */
const getCompanyAddresses = async (request, h) => {
  try {
    return companiesService.getCompanyAddresses(request.params.companyId)
  } catch (err) {
    return mapErrorResponse(err)
  }
}
/**
 * Creates new invoice account
 */
const createCompanyInvoiceAccount = async (request, h) => {
  const { startDate, regionId } = request.payload
  const { companyId } = request.params
  try {
    const invoiceAccount = invoiceAccountMapper.pojoToModel({
      company: {
        id: companyId
      },
      dateRange: {
        startDate,
        endDate: null
      }
    })

    const created = await invoiceAccountsService.createInvoiceAccount(regionId, invoiceAccount)

    return h.response(created).code(201)
  } catch (err) {
    logger.error('Error saving invoice account', err)
    return mapErrorResponse(err)
  }
}

const getCompanyContacts = async (request) => {
  const { companyId } = request.params

  try {
    const companyContacts = await companyContactsService.getCompanyContacts(companyId)
    return { data: companyContacts, error: null }
  } catch (err) {
    return mapErrorResponse(err)
  }
}

const postCompanyContact = async request => {
  const { companyId } = request.params
  return companyContactsService.postCompanyContact(companyId, request.payload)
}

const patchCompanyContact = async request => {
  const { companyId, contactId } = request.params
  return companyContactsService.patchCompanyContact(companyId, contactId, request.payload)
}

const deleteCompanyContact = async request => {
  const { companyId, companyContactId } = request.params
  return companyContactsService.deleteCompanyContact(companyId, companyContactId)
}

const getCompanyInvoiceAccounts = async request => {
  const { companyId } = request.params
  const { regionId } = request.query

  try {
    const invoiceAccounts = await companiesService.getCompanyInvoiceAccounts(companyId, regionId)
    return { data: invoiceAccounts, error: null }
  } catch (err) {
    return mapErrorResponse(err)
  }
}

const getCompanyLicences = async request => {
  const { companyId } = request.params
  try {
    const licences = await companiesService.getCompanyLicences(companyId)
    return { data: licences, error: null }
  } catch (err) {
    return mapErrorResponse(err)
  }
}

exports.getReturns = getReturns
exports.getCompany = getCompany
exports.searchCompaniesByName = searchCompaniesByName
exports.getCompanyAddresses = getCompanyAddresses
exports.createCompanyInvoiceAccount = createCompanyInvoiceAccount
exports.getCompanyContacts = getCompanyContacts
exports.postCompanyContact = postCompanyContact
exports.patchCompanyContact = patchCompanyContact
exports.deleteCompanyContact = deleteCompanyContact
exports.getCompanyInvoiceAccounts = getCompanyInvoiceAccounts
exports.getCompanyLicences = getCompanyLicences
