'use strict'

const Lab = require('@hapi/lab')
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const uuid = require('uuid/v4')

const contactsService = require('../../../src/lib/services/contacts-service')
const contactMapper = require('../../../src/lib/mappers/contact')
const helpers = require('../../../src/modules/contacts/lib/helpers')
const Contact = require('../../../src/lib/models/contact-v2')

const controller = require('../../../src/modules/contacts/controller')

const contactId = uuid()

const contact = {
  type: 'person',
  salutation: 'Mr',
  firstName: 'Johnny',
  lastName: 'Test',
  middleInitials: 'T',
  department: 'Test Department',
  suffix: 'MBE',
  isTest: true,
  dataSource: 'nald'
}

const createRequest = () => ({
  payload: contact,
  params: {
    contactId
  },
  defra: {
    internalCallingUser: {
      email: 'test@example.com'
    }
  }
})

experiment('modules/contacts/controller', () => {
  let contactModel

  beforeEach(async () => {
    contactModel = new Contact(contactId)
    contactModel.fromHash(contact)
    sandbox.stub(contactsService, 'createContact')
    sandbox.stub(contactsService, 'patchContact')
    sandbox.stub(contactsService, 'getContact')
    sandbox.stub(contactMapper, 'uiToModel').returns(contactModel)
    sandbox.stub(helpers, 'createContactEvent').resolves()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.postContact', () => {
    let request, response

    beforeEach(async () => {
      contactsService.createContact.resolves(contactModel)

      request = createRequest()
      response = await controller.postContact(request)
    })

    test('maps to contact model', async () => {
      expect(contactMapper.uiToModel.calledWith(
        request.payload
      )).to.be.true()
    })

    test('creates a new contact record', async () => {
      expect(contactsService.createContact.calledWith(
        contactModel
      )).to.be.true()
    })

    test('creates an event', async () => {
      expect(helpers.createContactEvent.calledWith({
        issuer: request.defra.internalCallingUser.email,
        contact: contactModel
      })).to.be.true()
    })

    test('returns contact mapped to model', async () => {
      expect(response).to.be.instanceOf(Contact)
      expect(response.id).to.equal(contactId)
      expect(response.type).to.equal(contact.type)
      expect(response.salutation).to.equal(contact.salutation)
      expect(response.firstName).to.equal(contact.firstName)
      expect(response.lastName).to.equal(contact.lastName)
      expect(response.middleInitials).to.equal(contact.middleInitials)
      expect(response.department).to.equal(contact.department)
      expect(response.suffix).to.equal(contact.suffix)
      expect(response.isTest).to.equal(contact.isTest)
      expect(response.dataSource).to.equal(contact.dataSource)
    })
  })

  experiment('.patchContact', () => {
    let request

    beforeEach(async () => {
      contactsService.patchContact.resolves(contactModel)

      request = createRequest()
      await controller.patchContact(request)
    })

    test('creates a new contact record', async () => {
      expect(contactsService.patchContact.calledWith(
        contactId,
        request.payload
      )).to.be.true()
    })
  })

  experiment('.getContact', () => {
    let request

    beforeEach(async () => {
      contactsService.getContact.resolves(contactModel)

      request = createRequest()
      await controller.getContact(request)
    })

    test('fetches the contact record', async () => {
      expect(contactsService.getContact.calledWith(
        contactId
      )).to.be.true()
    })
  })
})
