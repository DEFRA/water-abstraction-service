const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { expect } = require('@hapi/code')
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const documentsConnector = require('../../../../src/lib/connectors/crm-v2/documents')
const { v4: uuid } = require('uuid')

const config = require('../../../../config')

const TEST_RESPONSE = {
  error: null,
  data: []
}

const LICENCE_NUMBER = '01/123'
const DOCUMENT_ID = '0948217c-e89b-44f6-8329-4bc5ef2fe0f8'

experiment('lib/connectors/crm-2/documents', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves(TEST_RESPONSE)
    sandbox.stub(serviceRequest, 'post')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getDocuments', () => {
    let response

    beforeEach(async () => {
      response = await documentsConnector.getDocuments(LICENCE_NUMBER)
    })

    test('passes the expected URL to the request', async () => {
      const expectedUrl = `${config.services.crm_v2}/documents`
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal(expectedUrl)
    })

    test('passes the expected query string params', async () => {
      const [, options] = serviceRequest.get.lastCall.args
      expect(options.qs).to.equal({
        documentRef: LICENCE_NUMBER,
        regime: 'water',
        documentType: 'abstraction_licence'
      })
    })

    test('resolves with the HTTP response', async () => {
      expect(response).to.equal(TEST_RESPONSE)
    })
  })

  experiment('.getDocument', () => {
    let response

    beforeEach(async () => {
      response = await documentsConnector.getDocument(DOCUMENT_ID)
    })

    test('passes the expected URL to the request', async () => {
      const expectedUrl = `${config.services.crm_v2}/documents/${DOCUMENT_ID}`
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal(expectedUrl)
    })

    test('resolves with the HTTP response', async () => {
      expect(response).to.equal(TEST_RESPONSE)
    })
  })

  experiment('.createDocumentRole', () => {
    let documentRole
    let documentId
    let createdDocumentRole
    let result

    beforeEach(async () => {
      documentId = uuid()
      documentRole = {
        role: 'billing'
      }

      createdDocumentRole = { documentId, ...documentRole }
      serviceRequest.post.resolves(createdDocumentRole)
      result = await documentsConnector.createDocumentRole(documentId, documentRole)
    })

    test('makes a post request to the expected URL', async () => {
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal(`${config.services.crm_v2}/documents/${documentId}/roles`)
    })

    test('passes the expected document role data in the body', async () => {
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body).to.equal(documentRole)
    })

    test('returns the received data from the CRM', async () => {
      expect(result).to.equal(createdDocumentRole)
    })
  })

  experiment('.getDocumentRole', () => {
    let documentRoleId
    let documentRole
    let result

    beforeEach(async () => {
      documentRoleId = uuid()
      documentRole = { documentRoleId }
      serviceRequest.get.resolves(documentRole)
      result = await documentsConnector.getDocumentRole(documentRoleId)
    })

    test('makes a get request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal(`${config.services.crm_v2}/document-roles/${documentRoleId}`)
    })

    test('returns the received data from the CRM', async () => {
      expect(result).to.equal(documentRole)
    })
  })

  experiment('.getDocumentByRefAndDate', () => {
    let documentRef, documentId, date, result, expectedResponse

    beforeEach(async () => {
      documentId = uuid()
      documentRef = 'xxyyzz'
      date = '2020-10-10'

      expectedResponse = {
        documentId,
        documentRef,
        regime: 'water',
        documentType: 'abstraction_licence'
      }

      serviceRequest.get.resolves(expectedResponse)
      result = await documentsConnector.getDocumentByRefAndDate(documentRef, date)
    })

    test('makes a get request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal(`${config.services.crm_v2}/documents/search`)
    })

    test('returns the received data from the CRM', async () => {
      expect(result.documentId).to.equal(documentId)
    })
  })
})
