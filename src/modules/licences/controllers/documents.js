'use strict'

const moment = require('moment')
const Boom = require('@hapi/boom')
const documentsClient = require('../../../lib/connectors/crm/documents')
const crmEntities = require('../../../lib/connectors/crm/entities')
const { usersClient } = require('../../../lib/connectors/idm')
const permitClient = require('../../../lib/connectors/permit')
const { logger } = require('../../../logger')
const extractConditions = require('../lib/extractConditions')
const extractPoints = require('../lib/extractPoints')
const { licence: { regimeId, typeId } } = require('../../../../config')
const LicenceTransformer = require('../../../lib/licence-transformer')
const queries = require('../lib/queries')
const { createContacts } = require('../../../lib/models/factory/contact-list')
const eventHelper = require('../lib/event-helper')

const licencesService = require('../../../lib/services/licences')

const getDocumentHeader = async (documentId, includeExpired = false) => {
  const documentResponse = await documentsClient.findMany({
    document_id: documentId,
    includeExpired
  })
  return documentResponse.data[0]
}

const addDocumentDetails = (licence, document) => {
  return Object.assign(licence, {
    document: {
      name: document.document_name
    }
  })
}

/**
 * Throws a Boom unauthorized error if the supplied company ID does not
 * match that in the CRM document header
 * @param  {Object} documentHeader - CRM doc header
 * @param  {String} companyId      - the user's company ID
 */
const throwIfUnauthorised = (documentHeader, companyId) => {
  if (typeof companyId === 'undefined') {
    return
  }

  if (documentHeader.company_entity_id !== companyId) {
    throw Boom.unauthorized('Unauthorised to view licence data')
  }
}

/**
 * Gets licence data from permit repo
 * @param  {String|Object}  document     - CRM document ID GUID, or already loaded document header
 * @param  {Object}  [documentHeader] - If document header has already been loaded, it is not loaded again
 * @param {String} [companyId] - If supplied, the company ID must match that of the document header
 * @return {Promise}                resolves with permit repo data
 */
const getLicence = async (document, includeExpired, companyId) => {
  const documentHeader = document instanceof Object
    ? document
    : await getDocumentHeader(document, includeExpired)

  if (!documentHeader) {
    return
  }

  throwIfUnauthorised(documentHeader, companyId)

  const licenceResponse = await permitClient.licences.findMany({
    licence_id: documentHeader.system_internal_id,
    licence_type_id: typeId,
    licence_regime_id: regimeId
  })

  const licence = licenceResponse.data[0]

  if (licence) {
    return addDocumentDetails(licence, documentHeader)
  }
}

const handleUnexpectedError = (error, documentId) => {
  if (parseInt(error.statusCode) === 404) {
    return Boom.notFound('Not found', error)
  }

  logger.error('Failed to get licence data for document', error.stack, { documentId })
  return Boom.boomify(error)
}

const wrapData = data => ({
  error: null,
  data
})

const addEarliestEndDate = licence => {
  const dates = [
    { key: 'expired', date: licence.licence_data_value.EXPIRY_DATE },
    { key: 'lapsed', date: licence.licence_data_value.LAPSED_DATE },
    { key: 'revoked', date: licence.licence_data_value.REV_DATE }
  ]

  const endedDates = dates
    .map(date => {
      date.date = moment(date.date, 'DD/MM/YYYY')
      return date
    })
    .filter(date => date.date.isValid())
    .sort((l, r) => {
      if (l.date.isSame(r.date)) return 0
      return l.date.isBefore(r.date) ? -1 : 1
    })
    .map(date => {
      date.date = date.date.format('YYYY-MM-DD')
      return date
    })

  const earliest = endedDates.length ? endedDates[0] : { date: null, key: null }
  licence.earliestEndDate = earliest.date
  licence.earliestEndDateReason = earliest.key

  return licence
}

/**
 * Coordinates finding a full licence from the permit repository
 * using the CRM document ID.
 */
const getLicenceByDocumentId = async (request, h) => {
  const { documentId } = request.params
  const { includeExpired, companyId } = request.query

  try {
    const permitLicence = await getLicence(documentId, includeExpired, companyId)

    if (permitLicence) {
      const waterLicence = await licencesService.getLicenceByLicenceRef(permitLicence.licence_ref)
      const licence = {
        ...permitLicence,
        id: waterLicence.id
      }
      return wrapData(addEarliestEndDate(licence))
    }
    return Boom.notFound()
  } catch (error) {
    return handleUnexpectedError(error, documentId)
  }
}

/**
 * Gets the current version of the licence, then applies the given extract function
 *
 * @param {Object} request The HAPI request
 * @param {Function} extractFn The function to apply to the current version to yield the required subset of data
 * @returns {Object} The extracted data, wrapped in the comment return shape
 */
const extractLicenceData = async (request, extractFn) => {
  const { documentId } = request.params
  const { companyId } = request.query

  try {
    const licence = await getLicence(documentId, undefined, companyId)

    if (licence) {
      const currentVersion = licence.licence_data_value.data?.current_version
      return wrapData(extractFn(currentVersion))
    }
    return Boom.notFound()
  } catch (error) {
    return handleUnexpectedError(error, documentId)
  }
}

const getLicenceConditionsByDocumentId = async request =>
  extractLicenceData(request, extractConditions)

const getLicencePointsByDocumentId = async request =>
  extractLicenceData(request, extractPoints)

const getLicenceUsersByDocumentId = async (request, h) => {
  const { documentId } = request.params
  const { companyId, includeExpired } = request.query

  try {
    if (companyId) {
      const header = await getDocumentHeader(documentId, includeExpired)
      throwIfUnauthorised(header, companyId)
    }

    const documentUsers = await documentsClient.getDocumentUsers(documentId)
    const userEntityIds = (documentUsers.data ?? []).map(u => u.entityId)
    const { data: users } = await usersClient.getUsersByExternalId(userEntityIds)

    return {
      error: null,
      data: users.map(user => ({
        userId: user.user_id,
        entityId: user.external_id,
        userName: user.user_name,
        roles: documentUsers.data.find(d => d.entityId === user.external_id).roles
      }))
    }
  } catch (error) {
    return handleUnexpectedError(error, documentId)
  }
}

const mapSummary = async (documentHeader, licence) => {
  const transformer = new LicenceTransformer()
  await transformer.load(licence.licence_data_value)
  return {
    ...transformer.export(),
    documentName: documentHeader.document_name
  }
}

const mapContacts = data => {
  const contactList = createContacts(data.licence_data_value)
  return contactList.toArray().map(contact => ({
    ...contact,
    fullName: contact.getFullName()
  }))
}

/**
 * Gets licence summary for consumption by licence summary page in UI
 * @param  {Object}  request - HAPI request
 * @param {String} request.params.documentId - CRM document ID
 * @param  {Object}  h       - HAPI reply interface
 * @return {Promise}         resolves with JSON data for licence summary view
 */
const getLicenceSummaryByDocumentId = async (request, h) => {
  const { documentId } = request.params
  const { companyId, includeExpired } = request.query

  try {
    const documentHeader = await getDocumentHeader(documentId, includeExpired)
    if (!documentHeader) {
      return Boom.notFound(`Document ${documentId} not found`)
    }

    const licence = await getLicence(documentHeader, undefined, companyId)

    if (licence) {
      const data = await mapSummary(documentHeader, licence)

      // add the service layer model to the data object to allow the shift
      // towards using the licence model for viewing licences over the use
      // of the document entity from the CRM.
      data.waterLicence = await licencesService.getLicenceByLicenceRef(data.licenceNumber)

      data.contacts = mapContacts(licence)
      return { error: null, data }
    }
    return Boom.notFound()
  } catch (error) {
    return handleUnexpectedError(error, documentId)
  }
}

const mapNotification = (row) => {
  const messageRef = row.message_ref ?? ''
  const isPdf = messageRef.startsWith('pdf.')
  return {
    notificationId: row.id,
    messageType: row.message_type,
    date: row.send_after,
    notificationType: row.event_metadata.name ?? null,
    sender: row.issuer,
    isPdf
  }
}

const getLicenceCommunicationsByDocumentId = async (request, h) => {
  const { documentId } = request.params
  const { includeExpired, companyId } = request.query

  try {
    const documentHeader = await getDocumentHeader(documentId, includeExpired)
    throwIfUnauthorised(documentHeader, companyId)
    const notifications = await queries.getNotificationsForLicence(documentHeader.system_external_id)

    return {
      error: null,
      data: notifications.map(mapNotification)
    }
  } catch (error) {
    return handleUnexpectedError(error, documentId)
  }
}

const getLicenceCompanyByDocumentId = async (request, h) => {
  const { documentId } = request.params
  try {
    const document = await getDocumentHeader(documentId)
    const { data: company } = await crmEntities.getEntityCompanies(document.company_entity_id)
    return {
      data: {
        entityId: document.company_entity_id,
        companyName: company.entityName,
        licenceNumber: document.system_external_id
      },
      error: null
    }
  } catch (err) {
    return handleUnexpectedError(err, documentId)
  }
}

const postLicenceName = async (request, h) => {
  const { documentId } = request.params
  const { documentName } = request.payload
  const { data: currentDoc } = await documentsClient.findOne(documentId)

  if (!currentDoc) {
    return Boom.notFound(`Document ${documentId} not found`)
  }

  const rename = !!currentDoc.document_name
  const { data } = await documentsClient.setLicenceName(documentId, documentName)
  const metadata = { documentId, documentName, rename }
  const eventData = await eventHelper.saveEvent('licence:name', rename ? 'rename' : 'name', [data.system_external_id], 'completed', request.payload.userName, metadata)
  return { companyId: data.company_entity_id, licenceNumber: data.system_external_id, eventId: eventData.id, ...metadata }
}

exports.getLicenceByDocumentId = getLicenceByDocumentId
exports.getLicenceConditionsByDocumentId = getLicenceConditionsByDocumentId
exports.getLicencePointsByDocumentId = getLicencePointsByDocumentId
exports.getLicenceUsersByDocumentId = getLicenceUsersByDocumentId
exports.getLicenceSummaryByDocumentId = getLicenceSummaryByDocumentId
exports.getLicenceCommunicationsByDocumentId = getLicenceCommunicationsByDocumentId
exports.getLicenceCompanyByDocumentId = getLicenceCompanyByDocumentId
exports.postLicenceName = postLicenceName
