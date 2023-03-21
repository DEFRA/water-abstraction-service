'use strict'

/**
 * @module controller for returns APIs
 */
const Boom = require('@hapi/boom')
const { xor } = require('lodash')
const bluebird = require('bluebird')

const apiConnector = require('../lib/api-connector')
const { mapReturnToModel } = require('../lib/model-returns-mapper')
const returnsFacade = require('../lib/facade')
const eventFactory = require('../lib/event-factory')
const eventsService = require('../../../lib/services/events')
const licencesService = require('../../../lib/services/licences')
const returnsService = require('../../../lib/services/returns')

/**
 * A controller method to get a unified view of a return, to avoid handling
 * in UI layer
 */
const getReturn = async (request) => {
  const { returnId, versionNumber } = request.query

  const { return: ret, version, lines, versions } = await returnsFacade.getReturnData(returnId, versionNumber)

  return mapReturnToModel(ret, version, lines, versions)
}

/**
 * Accepts posted return data from UI layer and submits back to returns service
 */
const postReturn = async (request) => {
  const ret = request.payload

  // Persist data to return service
  const returnServiceData = await apiConnector.persistReturnData(ret)

  // Log event in water service event log
  const event = eventFactory.createSubmissionEvent(ret, returnServiceData.version)
  await eventsService.update(event)

  return {
    error: null
  }
}

/**
 * Allows the patching of return header data
 * @param {String} request.payload.returnId - the return_id in the returns.returns table
 * @param {String} [request.payload.status] - return status
 * @param {String} [request.payload.receivedDate] - date received, ISO 8601 YYYY-MM-DD
 * @param {String} [request.payload.isUnderQuery] - is the return under query
 * @return {Promise} resolves with JSON payload
 */
const patchReturnHeader = async (request) => {
  const data = await apiConnector.patchReturnData(request.payload)

  // Log event in water service event log
  const eventData = {
    ...request.payload,
    licenceNumber: data.licence_ref
  }

  const event = eventFactory.createSubmissionEvent(eventData, null, 'return.status')
  await eventsService.update(event)

  return {
    returnId: data.return_id,
    status: data.status,
    receivedDate: data.received_date,
    isUnderQuery: data.under_query
  }
}

const getLicenceNumber = licence => licence.licenceNumber
const toUpperCase = str => str.toUpperCase()

const createNotFoundBoomError = licenceNumbers => {
  const boomError = Boom.notFound('Licences not found')
  boomError.output.payload.validationDetails = { licenceNumbers }
  return boomError
}

const getLicenceDocumentReturns = async licence => {
  const documents = await returnsService.getReturnsWithContactsForLicence(licence.licenceNumber)
  return {
    licence,
    documents
  }
}

/**
 * Retrieves a list of paper forms that need sending to licence holders
 * for due returns
 */
const getIncompleteReturns = async request => {
  // Get unique list of upper-cased licence number strings
  // Create a new set to remove any duplicate values
  const licenceNumbers = [...new Set(request.query.licenceNumbers)].map(toUpperCase)

  // Find licence service models
  const licences = await licencesService.getLicencesByLicenceRefs(licenceNumbers)

  // Check if any requested were not found, and return 404
  const notFound = xor(licenceNumbers, licences.map(getLicenceNumber))
  if (notFound.length) {
    return createNotFoundBoomError(notFound)
  }

  return bluebird.map(licences, getLicenceDocumentReturns)
}

exports.getReturn = getReturn
exports.postReturn = postReturn
exports.patchReturnHeader = patchReturnHeader
exports.getIncompleteReturns = getIncompleteReturns
