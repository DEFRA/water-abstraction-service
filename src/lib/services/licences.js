'use strict'

const repos = require('../connectors/repos')
const licenceMapper = require('../mappers/licence')
const invoiceLicenceMapper = require('../../modules/billing/mappers/invoice-licence')
const invoiceMapper = require('../mappers/invoice')
const batchMapper = require('../../modules/billing/mappers/batch')
const invoiceAccountsMapper = require('../mappers/invoice-account')
const licenceVersionMapper = require('../mappers/licence-version')
const { INCLUDE_IN_SUPPLEMENTARY_BILLING } = require('../models/constants')

const service = require('./service')
const returns = require('./returns')
const scheduledNotifications = require('./scheduled-notifications')
const conditions = require('./licence-version-purpose-conditions')

const crmDocsConnector = require('../connectors/crm-v2/documents')
const crmCompaniesConnector = require('../connectors/crm-v2/companies')

/**
 * Gets a licence model by ID
 * @param {String} licenceId
 * @return {Promise<Licence>}
 */
const getLicenceById = async licenceId =>
  service.findOne(licenceId, repos.licences.findOne, licenceMapper)

/**
 * Finds a licence using the licence ref/number. Takes the region code
 * as well incase a licence has the same licence ref/number across
 * legacy regions
 *
 * @param {String} licenceRef
 */
const getLicenceByLicenceRef = async licenceRef => {
  const licence = await repos.licences.findOneByLicenceRef(licenceRef)
  return licence ? licenceMapper.dbToModel(licence) : null
}

/**
 * Gets an array of licences by IDs
 * @param {Array<String>} licenceRefs
 * @return {Promise<Array>} array of Licence service models
 */
const getLicencesByLicenceRefs = licenceRefs =>
  service.findMany(licenceRefs, repos.licences.findByLicenceRef, licenceMapper)

const getLicenceVersions = async licenceId =>
  service.findMany(
    licenceId,
    repos.licenceVersions.findByLicenceId,
    licenceVersionMapper
  )

const getLicenceVersionById = async licenceVersionId =>
  service.findOne(
    licenceVersionId,
    repos.licenceVersions.findOne,
    licenceVersionMapper
  )

/**
 * Updates the includeInSupplementaryBilling value for the given licence ids
 *
 * @param {String} from The status to move from (yes, no)
 * @param {String} to The status to move to (yes, no)
 * @param  {...String} licenceIds One or many licences ids to update
 */
const updateIncludeInSupplementaryBillingStatus = async (from, to, ...licenceIds) => {
  for (const licenceId of licenceIds) {
    await repos.licences.updateIncludeLicenceInSupplementaryBilling(licenceId, from, to)
  }
}

/**
 * Sets the water.licences.include_in_supplementary_billing value
 * from yes to no in the specified batch
 *
 * @param {String} batchId
 */
const updateIncludeInSupplementaryBillingStatusForSentBatch = async batchId => {
  return repos.licences.updateIncludeInSupplementaryBillingStatusForBatch(
    batchId,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.yes,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.no
  )
}

/**
 * Sets the water.licences.include_in_supplementary_billing value
 * from yes to no based on the region and batch created date
 *
 * NOTE: Logically, if you know the batch you would update the flag for those licences linked to it. The problem is a
 * licence might be flagged for inclusion but end up not being included. The billing process might calculate the
 * billable days as 0, or the debit line gets cancelled out by a credit in a supplementary bill run.
 *
 * Least, that is the issue we think the previous team were trying to tackle with this way of resetting the flags
 * when a bill run gets approved (only place this is called).
 *
 * @param {String} regionId
 * @param {Date} dateCreated
 */
const updateIncludeInSupplementaryBillingStatusForBatchCreatedDate = async (regionId, dateCreated) => repos.licences.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate(
  regionId,
  dateCreated,
  INCLUDE_IN_SUPPLEMENTARY_BILLING.yes,
  INCLUDE_IN_SUPPLEMENTARY_BILLING.no
)

const updateIncludeInSrocSupplementaryBillingStatusForBatchCreatedDate = async (regionId, dateCreated) => repos.licences.updateIncludeInSrocSupplementaryBillingStatusForBatchCreatedDate(
  regionId,
  dateCreated,
  INCLUDE_IN_SUPPLEMENTARY_BILLING.yes,
  INCLUDE_IN_SUPPLEMENTARY_BILLING.no
)

/**
 * Fetches the invoice accounts associated with a licence using the licence ref and date as input.
 * @todo move to invoice accounts service
 * @param {String} documentRef
 * @param {String} date
 */
const getLicenceAccountsByRefAndDate = async (documentRef, date) => {
  //  First, fetch the company ID from the CRM
  const { companyId } = await crmDocsConnector.getDocumentByRefAndDate(documentRef, date)

  //  Secondly, take the company ID and fetch the invoice accounts for that company from the CRM
  const invoiceAccounts = await crmCompaniesConnector.getInvoiceAccountsByCompanyId(companyId)

  //  Return the invoice accounts
  return invoiceAccounts ? invoiceAccounts.map(invoiceAccount => invoiceAccountsMapper.crmToModel(invoiceAccount)) : []
}

/**
 * Ensures the specified licence is included in the next supplementary bill run
 * @param {String} licenceId
 */
const flagForSupplementaryBilling = (licenceId, scheme = 'alcs') => {
  const argument = {}

  if (scheme === 'alcs') {
    argument.includeInSupplementaryBilling = INCLUDE_IN_SUPPLEMENTARY_BILLING.yes
  } else {
    argument.includeInSrocSupplementaryBilling = true
  }

  repos.licences.update(licenceId, argument)
}

/**
 * Retrieves the invoices associated with a licence
 * Used in the UI bills tab
 * @param {String} licenceId
 * @param {number} page
 * @param {number} perPage
 * @return {Promise<Licence>}
 */
const getLicenceInvoices = async (licenceId, page = 1, perPage = 10) => {
  const invoices = await repos.billingInvoiceLicences.findAll(licenceId, page, perPage)

  const mappedInvoices = invoices.data.map(row => {
    const temp = invoiceLicenceMapper.dbToModel(row)
    temp.invoice = invoiceMapper.dbToModel(row.billingInvoice)
    temp.batch = batchMapper.dbToModel(row.billingInvoice.billingBatch)

    return temp
  })
  return { data: mappedInvoices, pagination: invoices.pagination }
}

/**
 * Gets licences which have a current charge version linked to the
 * specified invoice account ID
 *
 * @param {String} invoiceAccountId
 */
const getLicencesByInvoiceAccountId = async invoiceAccountId => {
  const licences = await repos.licences.findByInvoiceAccountId(invoiceAccountId)
  return {
    data: licences.map(licenceMapper.dbToModel)
  }
}

/**
 * Gets licence returns, sorted by due date descending
 * Note: includes voids
 *
 * @param {String} licenceId
 * @param {Number} page
 * @param {Number} perPage
 * @return {Promise<Object>} contains { data, pagination}
 */
const getReturnsByLicenceId = async (licenceId, page, perPage) => {
  const licence = await getLicenceById(licenceId)
  if (!licence) {
    return null
  }
  return returns.getReturnsForLicence(licence.licenceNumber, page, perPage)
}

/**
 * Gets licence scheduled notifications
 *
 * @param {String} licenceId
 * @param {Number} page
 * @param {Number} perPage
 * @return {Promise<Object>} contains { data, pagination}
 */
const getScheduledNotificationsByLicenceId = async (licenceId, page, perPage) => {
  const licence = await getLicenceById(licenceId)
  if (!licence) {
    return null
  }
  return scheduledNotifications.getScheduledNotificationsByLicenceNumber(licence.licenceNumber, page, perPage)
}

const getLicenceVersionPurposeConditionsByLicenceId = async (licenceId, code) => {
  const licence = await getLicenceById(licenceId)

  if (!licence) {
    return null
  }

  return conditions.getLicenceVersionPurposeConditionsByLicenceId(licenceId, code)
}

const markLicenceForSupplementaryBilling = licenceId =>
  repos.licences.updateIncludeLicenceInSupplementaryBilling(
    licenceId,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.no,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.yes
  )

exports.getLicenceById = getLicenceById
exports.getLicencesByLicenceRefs = getLicencesByLicenceRefs
exports.getLicenceVersionById = getLicenceVersionById
exports.getLicenceVersions = getLicenceVersions
exports.getLicenceByLicenceRef = getLicenceByLicenceRef
exports.getLicenceAccountsByRefAndDate = getLicenceAccountsByRefAndDate
exports.updateIncludeInSupplementaryBillingStatus = updateIncludeInSupplementaryBillingStatus
exports.updateIncludeInSupplementaryBillingStatusForSentBatch = updateIncludeInSupplementaryBillingStatusForSentBatch
exports.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate = updateIncludeInSupplementaryBillingStatusForBatchCreatedDate
exports.updateIncludeInSrocSupplementaryBillingStatusForBatchCreatedDate = updateIncludeInSrocSupplementaryBillingStatusForBatchCreatedDate
exports.flagForSupplementaryBilling = flagForSupplementaryBilling
exports.getLicenceInvoices = getLicenceInvoices
exports.getLicencesByInvoiceAccountId = getLicencesByInvoiceAccountId
exports.getReturnsByLicenceId = getReturnsByLicenceId
exports.getScheduledNotificationsByLicenceId = getScheduledNotificationsByLicenceId
exports.getLicenceVersionPurposeConditionsByLicenceId = getLicenceVersionPurposeConditionsByLicenceId
exports.markLicenceForSupplementaryBilling = markLicenceForSupplementaryBilling
