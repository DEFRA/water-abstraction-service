'use strict'

const companiesConnector = require('../connectors/crm-v2/companies')
const regionsService = require('./regions-service')
const mappers = require('../mappers')
const invoiceAccountMapper = require('../mappers/invoice-account')
const { NotFoundError, InvalidEntityError } = require('../errors')
const { getExistingEntity } = require('../crm-response')
const { CONTACT_ROLES } = require('../models/constants')

const getCompany = async companyId => {
  const company = await companiesConnector.getCompany(companyId)
  if (company) return mappers.company.crmToModel(company)
  throw new NotFoundError(`Company ${companyId} not found`)
}

const searchCompaniesByName = async (name, soft) => {
  const companies = await companiesConnector.searchCompaniesByName(name, soft)
  return Array.isArray(companies) ? companies.map(mappers.company.crmToModel) : []
}

const getCompanyAddresses = async companyId => {
  const companyAddresses = await companiesConnector.getCompanyAddresses(companyId)
  return companyAddresses.map(mappers.companyAddress.crmToModel)
}

/**
 * Attempts to create a company
 * If the company already exists (e.g. conflicting companies house number)
 * then the existing model is returned
 *
 * @param {Company}
 * @return {Promise<Company>}
 */
const createCompany = async companyModel => {
  let company
  try {
    company = await companiesConnector.createCompany(mappers.company.modelToCrm(companyModel))
  } catch (err) {
    company = getExistingEntity(err)
  }
  return mappers.company.crmToModel(company)
}

const createCompanyAddress = async (companyId, addressId, options = {}) => {
  const defaults = {
    roleName: CONTACT_ROLES.licenceHolder,
    isDefault: true
  }
  const companyAddressData = Object.assign({}, defaults, options, { addressId })
  let companyAddress
  try {
    companyAddress = await companiesConnector.createCompanyAddress(companyId, companyAddressData)
  } catch (err) {
    companyAddress = getExistingEntity(err)
  }
  return mappers.companyAddress.crmToModel(companyAddress)
}

const createCompanyContact = async (companyId, contactId, options = {}) => {
  const defaults = {
    roleName: CONTACT_ROLES.licenceHolder,
    isDefault: true
  }
  const companyContactData = Object.assign({}, defaults, options, { contactId })
  let companyContact
  try {
    companyContact = await companiesConnector.createCompanyContact(companyId, companyContactData)
  } catch (err) {
    companyContact = getExistingEntity(err)
  }
  return mappers.companyContact.crmToModel(companyContact)
}

const getCompanyModel = companyData => {
  if (!companyData) return null
  const companyModel = mappers.company.uiToModel(companyData)
  if (!companyModel.id && !!companyModel) {
    const { error } = companyModel.isValid()
    if (error) throw new InvalidEntityError('Invalid company', error)
  };
  return companyModel
}

const deleteCompany = company => companiesConnector.deleteCompany(company.id)

const deleteCompanyAddress = companyAddress => companiesConnector.deleteCompanyAddress(companyAddress.companyId, companyAddress.id)

const deleteCompanyContact = companyContact => companiesConnector.deleteCompanyContact(companyContact.companyId, companyContact.id)

/**
 * Gets company invoice accounts
 * @param {String} companyId
 * @param {String} [regionId]
 * @return {Promise<Array>}
 */
const getCompanyInvoiceAccounts = async (companyId, regionId) => {
  let data = await companiesConnector.getInvoiceAccountsByCompanyId(companyId)

  // Filter by region if specified
  if (regionId) {
    const region = await regionsService.getRegion(regionId)
    data = data.filter(row =>
      row.invoiceAccountNumber.startsWith(region.code)
    )
  }

  return data.map(invoiceAccountMapper.crmToModel)
}

const getCompanyLicences = async companyId =>
  companiesConnector.getCompanyLicences(companyId)

exports.getCompany = getCompany
exports.getCompanyAddresses = getCompanyAddresses
exports.createCompany = createCompany
exports.createCompanyAddress = createCompanyAddress
exports.createCompanyContact = createCompanyContact
exports.getCompanyModel = getCompanyModel
exports.deleteCompany = deleteCompany
exports.deleteCompanyAddress = deleteCompanyAddress
exports.deleteCompanyContact = deleteCompanyContact
exports.searchCompaniesByName = searchCompaniesByName
exports.getCompanyInvoiceAccounts = getCompanyInvoiceAccounts
exports.getCompanyLicences = getCompanyLicences
