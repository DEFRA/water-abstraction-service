'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const uuid = require('uuid/v4')

const contactsConnector = require('../../../../src/lib/connectors/crm-v2/contacts')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

experiment('lib/connectors/crm-v2/contacts', () => {
  beforeEach(async () => {
    sandbox.stub(config.services, 'crm_v2').value('http://test.defra')
    sandbox.stub(serviceRequest, 'get').resolves()
    sandbox.stub(serviceRequest, 'post')
    sandbox.stub(serviceRequest, 'patch')
    sandbox.stub(serviceRequest, 'delete')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getContact', () => {
    let response

    beforeEach(async () => {
      serviceRequest.get.resolves({
        contactId: 'test-contact-id'
      })

      response = await contactsConnector.getContact('test-contact-id')
    })

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal('http://test.defra/contacts/test-contact-id')
    })

    test('returns the result from the crm', async () => {
      expect(response).to.equal({
        contactId: 'test-contact-id'
      })
    })
  })

  experiment('.getContacts', () => {
    let response

    beforeEach(async () => {
      serviceRequest.get.resolves([
        { contactId: 'test-contact-id-1' },
        { contactId: 'test-contact-id-2' }
      ])

      response = await contactsConnector.getContacts([
        'test-contact-id-1',
        'test-contact-id-2'
      ])
    })

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal('http://test.defra/contacts')
    })

    test('adds the contacts ids to the query string as a comma separated string', async () => {
      const [, options] = serviceRequest.get.lastCall.args
      expect(options.qs.id).to.equal([
        'test-contact-id-1',
        'test-contact-id-2'
      ])
    })

    test('sets the querystring options to allow repeating params', async () => {
      const [, options] = serviceRequest.get.lastCall.args
      expect(options.qsStringifyOptions.arrayFormat).to.equal('repeat')
    })

    test('returns the result from the crm', async () => {
      expect(response).to.equal([
        { contactId: 'test-contact-id-1' },
        { contactId: 'test-contact-id-2' }
      ])
    })
  })

  experiment('.createContact', () => {
    let contact
    let contactId
    let result

    beforeEach(async () => {
      contactId = uuid()
      contact = { firstName: 'Test' }

      serviceRequest.post.resolves({ contactId, ...contact })
      result = await contactsConnector.createContact(contact)
    })

    test('makes a post to the expected URL', async () => {
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal('http://test.defra/contacts')
    })

    test('passes the contact to the post', async () => {
      const [, options] = serviceRequest.post.lastCall.args
      expect(options).to.equal({ body: contact })
    })

    test('returns the entity from the CRM', async () => {
      expect(result.contactId).to.equal(contactId)
      expect(result.firstName).to.equal('Test')
    })
  })

  experiment('.deleteContact', () => {
    beforeEach(async () => {
      serviceRequest.delete.resolves()

      await contactsConnector.deleteContact('test-contact-id')
    })

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.delete.lastCall.args
      expect(url).to.equal('http://test.defra/contacts/test-contact-id')
    })
  })

  experiment('.patchContact', () => {
    beforeEach(async () => {
      serviceRequest.patch.resolves()

      await contactsConnector.patchContact('test-contact-id', { some: 'payload' })
    })

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.patch.lastCall.args
      expect(url).to.equal('http://test.defra/contacts/test-contact-id')
    })
  })
})
