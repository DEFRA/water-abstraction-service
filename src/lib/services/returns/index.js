'use strict'

const bluebird = require('bluebird')
const moment = require('moment')

const DATE_FORMAT = 'YYYY-MM-DD'

const returnsDateHelpers = require('@envage/water-abstraction-helpers').returns.date

const apiConnector = require('./api-connector')
const returnVersionMapper = require('../../mappers/return-version')

// Services
const documentsService = require('../documents-service')
const returnsMappingService = require('./returns-mapping-service')

// Models
const { RETURN_STATUS } = require('../../models/return')
const { ROLE_NAMES } = require('../../models/role')

const getFinancialYear = returnCycle => {
  const endYear = parseInt(returnCycle.endDate.substr(0, 4))
  return returnCycle.isSummer ? endYear + 1 : endYear
}

/**
 * Gets all non-void returns for the given licence number
 * within the supplied financial year
 * @param {String} licenceNumber
 * @param {FinancialYear} financialYear
 * @return {Promise<Array>}
 */
const fetchReturns = async (licenceNumber, financialYear) => {
  const cycles = returnsDateHelpers.createReturnCycles(`${(financialYear.endYear - 2)}-01-01`)
    .filter(cycle => getFinancialYear(cycle) === financialYear.endYear)

  // Make API call to get returns for each cycle
  const tasks = cycles.map(cycle => apiConnector.getReturnsForLicenceInCycle(licenceNumber, cycle))
  const data = await Promise.all(tasks)

  // Return as single flat array
  return data.flat(Infinity)
}

/**
 * Loads the current return version and lines, maps to service models,
 * and decorates the supplied Return model with them
 * @param {Return} ret
 * @return {Promise<Return>}
 */
const decorateWithCurrentVersion = async ret => {
  if (ret.status !== RETURN_STATUS.completed) {
    return ret
  }
  // Load current version
  const version = await apiConnector.getCurrentVersion(ret.id)
  if (!version) {
    return ret
  }
  // Load lines
  let lines
  if (!version.nil_return) {
    lines = await apiConnector.getLines(version.version_id)
  }
  // Map to service models
  ret.returnVersions = [
    returnVersionMapper.returnsServiceToModel(version, lines)
  ]
  return ret
}

/**
 * Gets all returns for the licence in the supplied FinancialYear
 * Resolves with an array of Return service model instances, each
 * with the current version loaded
 * @param {String} licenceNumber
 * @param {FinancialYear} financialYear
 * @return {Promise<Array>}
 */
const getReturnsForLicenceInFinancialYear = async (licenceNumber, financialYear) => {
  // Get returns from returns service
  const returnsData = await fetchReturns(licenceNumber, financialYear)

  // Map to service models including locally loaded ReturnRequirement
  const returns = await returnsMappingService.mapReturnsToModels(returnsData)

  // Decorate each return with its current version
  const tasks = returns.map(decorateWithCurrentVersion)
  return Promise.all(tasks)
}

/**
 * Checks whether the role is either a licence holder or returns role
 * @param {Role} role
 * @return {Boolean}
 */
const isRoleLicenceHolderOrReturns = role => role.isRoleName(ROLE_NAMES.licenceHolder, ROLE_NAMES.returnsTo)

/**
 * Checks whether the role is either current, or was active on the
 * end date of the document
 * @param {Document} document
 * @param {Role} role
 * @return {Boolean}
 */
const isRoleDateRangeValid = (document, role) => {
  // Returns role with open-ended range (has not ended)
  if (role.dateRange.endDate === null) {
    return true
  }
  // Returns role which ends on document end date (was active at end date of document)
  if (role.dateRange.endDate === document.dateRange.endDate) {
    return true
  }
  return false
}

/**
 * Gets the relevant returns roles for the specified document which:
 * - Are either a licence holder or returns role
 * - Either have an open-ended date range, or end on the document end date
 * @param {Document} document
 * @return {Array<Role>}
 */
const filterDocumentRoles = document => {
  // We only care about:
  // - The most recent licence holder and returns roles
  // - If the role has already ended, they can also be ignored
  return document.roles
    .filter(isRoleLicenceHolderOrReturns)
    .filter(role => isRoleDateRangeValid(document, role))
}

/**
 * Gets the latter of: document start date, 2009-03-31
 * @param {Document} document
 * @return {String} date YYYY-MM-DD
 */
const getFilterStartDate = (document) => {
  const item = [document.dateRange.startDate, '2009-03-31'].sort()
  return item[item.length - 1]
}

/**
 * Gets the earlier of: document end date, today's date
 * Filter will filter out any falsey values
 * @param {Document} document
 * @return {String} date YYYY-MM-DD
 */
const getFilterEndDate = (document) => {
  const result = [document.dateRange.endDate, moment().format(DATE_FORMAT)]
    .filter(a => a)
    .sort()

  return result[0]
}

/**
 * Gets both the CRM document and a list of returns for the specified
 * licence number and document ID.
 * - The returns are any due/received returns whose end date was
 *   within the date-range of the specified document
 * - The document roles are filtered to only include relevant results
 * @param {String} licenceNumber
 * @param {String} documentId
 * @return {Array<Object>}
 */
const getDocumentReturns = async (licenceNumber, documentId) => {
  // Get full document from CRM
  const document = await documentsService.getDocument(documentId)

  // Filter document roles to only include relevant current roles for returns
  document.roles = filterDocumentRoles(document)

  // Get returns with "due" or "received" status with end date during the document date range
  const returnsData = await apiConnector.getLicenceReturnsByStatusAndEndDate(licenceNumber, [
    RETURN_STATUS.due,
    RETURN_STATUS.received
  ], getFilterStartDate(document), getFilterEndDate(document))

  // Map to service models including locally loaded ReturnRequirement
  const returns = await returnsMappingService.mapReturnsToModels(returnsData)

  return {
    returns,
    document
  }
}

/**
 * For the paper forms flow
 * Gets both the CRM documents and due/received returns relating the supplied licence number
 * @param {String} licenceNumber
 * @param {Array<String>} returns statuses to fetch
 * @return {Array<Object>} each object contains { document, returns : [] }
 */
const getReturnsWithContactsForLicence = async (licenceNumber) => {
  // Find documents for licence
  const documents = await documentsService.getDocuments(licenceNumber)

  // Get full document structure with list of returns
  const documentsAndReturns = bluebird.map(documents, document => getDocumentReturns(licenceNumber, document.id))

  // Exclude any documents without any returns
  return documentsAndReturns.filter(row => row.returns.length > 0)
}

const getReturnsForLicence = async (licenceNumber, page, perPage) => {
  const { data, pagination } = await apiConnector.getReturnsForLicence(licenceNumber, page, perPage)

  return {
    data: await returnsMappingService.mapReturnsToModels(data),
    pagination
  }
}

exports.getReturnsForLicenceInFinancialYear = getReturnsForLicenceInFinancialYear
exports.getReturnsWithContactsForLicence = getReturnsWithContactsForLicence
exports.getReturnsForLicence = getReturnsForLicence
