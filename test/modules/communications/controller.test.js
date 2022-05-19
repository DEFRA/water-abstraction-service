'use strict'

const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const controller = require('../../../src/modules/communications/controller')
const notificationsController = require('../../../src/controllers/notifications')
const eventsController = require('../../../src/controllers/events')
const crmDocumentConnector = require('../../../src/lib/connectors/crm/documents')
const crmResponses = require('../../responses/crm/documentHeader')

const notificationResult = {
  rowCount: 1,
  rows: [{
    id: 'notification-id',
    recipient: 'n/a',
    message_type: 'letter',
    message_ref: 'notification-letter',
    personalisation: {
      postcode: 'PO5 0TC',
      address_line_1: 'Add 1',
      address_line_2: 'Add 2',
      address_line_3: 'Add 3',
      address_line_4: 'Add 4',
      address_line_5: 'Add 5'
    },
    send_after: '2018-01-01T00:00:00.000Z',
    status: 'sent',
    log: null,
    licences: ['lic-1', 'lic-2'],
    individual_entity_id: null,
    company_entity_id: 'company-id',
    medium: null,
    notify_id: 'notify-id',
    notify_status: 'received',
    plaintext: 'test message content',
    event_id: 'evt-id',
    metadata: {}
  }]
}

const eventResult = {
  rowCount: 1,
  rows: [{
    event_id: 'evt-id',
    reference_code: 'ABC-1234',
    type: 'notification',
    subtype: 'abc-resume',
    issuer: 'issuer@example.com',
    licences: ['lic-1', 'lic-2'],
    entities: ['entity-id'],
    comment: null,
    metadata: {
      name: 'Test name'
    },
    status: 'sent',
    created: '2018-01-01T00:00:00.000Z'
  }]
}

experiment('getCommunication', () => {
  let request
  beforeEach(async () => {
    sandbox.stub(notificationsController.repository, 'find').resolves(notificationResult)
    sandbox.stub(eventsController.repository, 'find').resolves(eventResult)
    sandbox.stub(crmDocumentConnector, 'getDocumentsByLicenceNumbers').resolves(crmResponses.singleResponse().data)

    request = {
      params: {
        communicationId: 'communication-id'
      }
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('returns a 404 if the notification is not found', async () => {
    notificationsController.repository.find.resolves({
      rowCount: 0,
      rows: []
    })

    const response = await controller.getCommunication(request)

    expect(response.isBoom).to.be.true()
    expect(response.output.payload).to.equal({
      statusCode: 404,
      error: 'Not Found',
      message: 'No notification found for communication-id'
    })
  })

  test('returns a 404 if the event is not found', async () => {
    eventsController.repository.find.resolves({
      rowCount: 0,
      rows: []
    })

    const response = await controller.getCommunication(request)

    expect(response.isBoom).to.be.true()
    expect(response.output.payload).to.equal({
      statusCode: 404,
      error: 'Not Found',
      message: 'Notification event evt-id not found'
    })
  })

  test('returns a 404 if the licence document is not found', async () => {
    crmDocumentConnector.getDocumentsByLicenceNumbers.resolves(crmResponses.notFound())

    const response = await controller.getCommunication(request)

    expect(response.isBoom).to.be.true()
    expect(response.output.payload).to.equal({
      statusCode: 404,
      error: 'Not Found',
      message: 'No document found for lic-1,lic-2'
    })
  })

  test('returns the expected notification data', async () => {
    const { data } = await controller.getCommunication(request)
    const { notification } = data

    expect(notification.id).to.equal('notification-id')
    expect(notification.recipient).to.equal('n/a')
    expect(notification.messageRef).to.equal('notification-letter')
    expect(notification.messageType).to.equal('letter')
    expect(notification.licences).to.have.length(2)
    expect(notification.licences).to.only.include(['lic-1', 'lic-2'])
    expect(notification.plainText).to.equal('test message content')
    expect(notification.address).to.equal({
      addressLine1: 'Add 1',
      addressLine2: 'Add 2',
      addressLine3: 'Add 3',
      addressLine4: 'Add 4',
      addressLine5: 'Add 5',
      postcode: 'PO5 0TC'
    })
  })

  test('returns the expected event data', async () => {
    const { data } = await controller.getCommunication(request)
    const { evt } = data

    expect(evt.id).to.equal('evt-id')
    expect(evt.referenceCode).to.equal('ABC-1234')
    expect(evt.type).to.equal('notification')
    expect(evt.issuer).to.equal('issuer@example.com')
    expect(evt.subType).to.equal('abc-resume')
    expect(evt.createdDate).to.equal('2018-01-01T00:00:00.000Z')
    expect(evt.name).to.equal('Test name')
  })

  test('returns the expected document data', async () => {
    const { data } = await controller.getCommunication(request)
    const { licenceDocuments } = data

    expect(licenceDocuments).to.have.length(1)
    expect(licenceDocuments[0].documentId).to.equal('document-id')
    expect(licenceDocuments[0].companyEntityId).to.equal('company-entity-id')
    expect(licenceDocuments[0].documentName).to.equal('A document name')
    expect(licenceDocuments[0].licenceRef).to.equal('lic-1')
  })
})
