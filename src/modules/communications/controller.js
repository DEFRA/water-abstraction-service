const notificationsController = require('../../controllers/notifications')
const eventsController = require('../../controllers/events')
const { get, mapKeys, camelCase } = require('lodash')
const Boom = require('@hapi/boom')
const crmDocumentConnector = require('../../lib/connectors/crm/documents')

const camelCaseKeys = obj => mapKeys(obj, (value, key) => camelCase(key))

const getNotification = async id => {
  const result = await notificationsController.repository.find({ id })

  const notification = get(result, 'rows[0]')

  if (!notification) {
    throw Boom.notFound(`No notification found for ${id}`)
  }
  return notification
}

const formatNotification = notification => {
  const { id, recipient, message_ref: messageRef, message_type: messageType, licences } = notification
  const data = { id, recipient, message_ref: messageRef, message_type: messageType, licences }
  data.plainText = notification.plaintext
  const {
    address_line_1: addressLine1,
    address_line_2: addressLine2,
    address_line_3: addressLine3,
    address_line_4: addressLine4,
    address_line_5: addressLine5,
    postcode
  } = notification.personalisation
  data.address = camelCaseKeys({
    address_line_1: addressLine1,
    address_line_2: addressLine2,
    address_line_3: addressLine3,
    address_line_4: addressLine4,
    address_line_5: addressLine5,
    postcode
  })
  return camelCaseKeys(data)
}

const formatEvent = evt => {
  const { reference_code: referenceCode, type, issuer } = evt
  const data = { reference_code: referenceCode, type, issuer }
  data.id = evt.event_id
  data.subType = evt.subtype
  data.createdDate = evt.created
  data.name = get(evt, 'metadata.name')
  return camelCaseKeys(data)
}

const getLicenceDocuments = async licenceNumbers => {
  const documents = await crmDocumentConnector.getDocumentsByLicenceNumbers(licenceNumbers)

  if (!documents.length) {
    throw Boom.notFound(`No document found for ${licenceNumbers.join()}`)
  }

  return documents
}

const formatDocuments = documents => {
  return documents.map(doc => {
    const { document_id: documentId, company_entity_id: companyEntityId, document_name: documentName } = doc
    const data = { document_id: documentId, company_entity_id: companyEntityId, document_name: documentName }
    data.licenceRef = doc.system_external_id
    return camelCaseKeys(data)
  })
}

const getEvent = async id => {
  const result = await eventsController.repository.find({ event_id: id })
  const evt = get(result, 'rows[0]')

  if (!evt) {
    throw Boom.notFound(`Notification event ${id} not found`)
  }
  return evt
}

const getCommunication = async (request, h) => {
  const notificationId = request.params.communicationId

  try {
    const notification = await getNotification(notificationId)
    const [evt, licenceDocuments] = await Promise.all([
      getEvent(notification.event_id),
      getLicenceDocuments(notification.licences)
    ])

    return {
      data: {
        notification: formatNotification(notification),
        evt: formatEvent(evt),
        licenceDocuments: formatDocuments(licenceDocuments)
      },
      error: null
    }
  } catch (error) {
    if (error.isBoom) {
      return error
    }
  }
}

module.exports = {
  getCommunication
}
