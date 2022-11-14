const idmConnector = require('../../lib/connectors/idm')
const crmDocumentsConnector = require('../../lib/connectors/crm/documents')
const event = require('../../lib/event')
const Boom = require('@hapi/boom')
const { logger } = require('../../logger')

const userCanUnlinkLicences = user => user.roles.includes('unlink_licences')

/**
* Get Calling User data and check that they have the appropriate permissions
* @param  {Integer} callingUserId User Id of internal user making request
* @return {Object}                User data
*/
const getCallingUser = async callingUserId => {
  const user = await idmConnector.usersClient.findOneById(callingUserId)

  if (!userCanUnlinkLicences(user)) {
    throw Boom.forbidden('Calling user not authorised to unlink licence')
  }

  return user
}

const unlinkLicenceInCRM = documentId => {
  const filter = { document_id: documentId, company_entity_id: { $ne: null } }
  const body = { company_entity_id: null, verification_id: null, document_name: null }
  return crmDocumentsConnector.updateMany(filter, body)
}

const createUnlinkLicenceEvent = (callingUser, documentId) => {
  const auditEvent = event.create({
    type: 'unlink-licence',
    issuer: callingUser.user_name,
    metadata: {
      documentId
    }
  })
  return event.save(auditEvent)
}

/**
 * Unlinks licence from User
 * @param  {Object} request - HAPI request
 * @param  {Object} h       - HAPI reply interface
 * @return {Promise}         [description]
 */
const patchUnlinkLicence = async (request, h) => {
  const { callingUserId } = request.payload
  const { documentId } = request.params

  try {
    const callingUser = await getCallingUser(callingUserId)
    const { data, rowCount } = await unlinkLicenceInCRM(documentId)
    if (rowCount === 0) {
      return h.response({ data, error: null }).code(202)
    }

    await createUnlinkLicenceEvent(callingUser, documentId)
    return h.response({ data, error: null }).code(200)
  } catch (err) {
    logger.error('Failed to unlink licence', err.stack, { callingUserId, documentId })
    if (err.isBoom) {
      return h.response({ data: null, error: err }).code(err.output.statusCode)
    }
    throw err
  }
}

exports.patchUnlinkLicence = patchUnlinkLicence
exports.getCallingUser = getCallingUser
exports.unlinkLicenceInCRM = unlinkLicenceInCRM
exports.createUnlinkLicenceEvent = createUnlinkLicenceEvent
