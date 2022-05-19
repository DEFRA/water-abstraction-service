const notificationsController = require('../../controllers/notifications')
const eventsController = require('../../controllers/events')
const { get, mapKeys, camelCase, pick } = require('lodash')
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
  const data = pick(notification, ['id', 'recipient', 'message_ref', 'message_type', 'licences'])
  data.plainText = notification.plaintext
  data.address = camelCaseKeys(pick(notification.personalisation, [
    'address_line_1',
    'address_line_2',
    'address_line_3',
    'address_line_4',
    'address_line_5',
    'postcode'
  ]))
  return camelCaseKeys(data)
}

const formatEvent = evt => {
  const data = pick(evt, ['reference_code', 'type', 'issuer'])
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
    const data = pick(doc, ['document_id', 'company_entity_id', 'document_name'])
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
