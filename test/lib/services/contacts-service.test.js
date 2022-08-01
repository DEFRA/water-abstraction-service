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
const contactsService = require('../../../src/lib/services/contacts-service')
const Contact = require('../../../src/lib/models/contact-v2')
const contactsConnector = require('../../../src/lib/connectors/crm-v2/contacts')
const contactsMapper = require('../../../src/lib/mappers/contact')
const { InvalidEntityError } = require('../../../src/lib/errors')

experiment('modules/billing/services/contacts-service', () => {
  let connectorResponse
  beforeEach(async () => {
    connectorResponse = [
      { contactId: uuid(), initials: 'AB', salutation: 'Mr', firstName: 'Testy', lastName: 'Mc Testface' },
      { contactId: uuid(), initials: 'BC', salutation: 'Mrs', firstName: 'Testy', lastName: 'Mc Testface' }
    ]
    sandbox.stub(contactsConnector, 'getContacts').resolves(connectorResponse)
    sandbox.stub(contactsConnector, 'getContact').resolves(connectorResponse[0])
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getContact', () => {
    test('passes the contactId to the connector', async () => {
      const ids = [uuid()]
      await contactsService.getContact(ids[0])

      const [passedId] = contactsConnector.getContact.lastCall.args

      expect(passedId).to.equal(ids[0])
    })

    test('returns the data as Contact objects', async () => {
      const response = await contactsService.getContact(uuid())
      expect(response).to.be.an.instanceOf(Contact)
      expect(response.id).to.equal(connectorResponse[0].contactId)
      expect(response.salutation).to.equal(connectorResponse[0].salutation)
      expect(response.initials).to.equal(connectorResponse[0].initials)
      expect(response.firstName).to.equal(connectorResponse[0].firstName)
      expect(response.lastName).to.equal(connectorResponse[0].lastName)
    })
  })

  experiment('.getContacts', () => {
    test('passes the contactIds to the connector', async () => {
      const ids = [uuid()]
      await contactsService.getContacts(ids)

      const [passedIds] = contactsConnector.getContacts.lastCall.args

      expect(passedIds).to.equal(ids)
    })

    test('returns the data as Contact objects', async () => {
      const response = await contactsService.getContacts([uuid()])
      expect(response[0]).to.be.an.instanceOf(Contact)
      expect(response[0].id).to.equal(connectorResponse[0].contactId)
      expect(response[0].salutation).to.equal(connectorResponse[0].salutation)
      expect(response[0].initials).to.equal(connectorResponse[0].initials)
      expect(response[0].firstName).to.equal(connectorResponse[0].firstName)
      expect(response[0].lastName).to.equal(connectorResponse[0].lastName)

      expect(response[1]).to.be.an.instanceOf(Contact)
      expect(response[1].id).to.equal(connectorResponse[1].contactId)
      expect(response[1].salutation).to.equal(connectorResponse[1].salutation)
      expect(response[1].initials).to.equal(connectorResponse[1].initials)
      expect(response[1].firstName).to.equal(connectorResponse[1].firstName)
      expect(response[1].lastName).to.equal(connectorResponse[1].lastName)
    })
  })

  experiment('.createContact', () => {
    const contactId = uuid()
    let contactData, mappedData, newContact, contactModel, response
    beforeEach(async () => {
      contactData = {
        salutation: 'Mr',
        firstName: 'John',
        lastName: 'Test'
      }
      mappedData = {
        salutation: 'Mr',
        firstName: 'John',
        lastName: 'Test'
      }
      newContact = {
        contactId,
        salutation: 'Mr',
        firstName: 'John',
        lastName: 'Test'
      }
      contactModel = new Contact(contactId)
      sandbox.stub(contactsMapper, 'modelToCrm').returns(mappedData)
      sandbox.stub(contactsMapper, 'crmToModel').resolves(contactModel)

      sandbox.stub(contactsConnector, 'createContact').resolves(newContact)

      response = await contactsService.createContact(contactData)
    })

    afterEach(async () => {
      sandbox.restore()
    })

    test('calls the contact mapper to map data for the DB call', async () => {
      const [passedData] = contactsMapper.modelToCrm.lastCall.args
      expect(passedData).to.equal(contactData)
    })

    test('calls the contact connector with the mapped data', async () => {
      const [contactData] = contactsConnector.createContact.lastCall.args
      expect(contactData).to.equal(mappedData)
    })

    test('calls the crm to model mapper with the output of the crm call', async () => {
      const [contactData] = contactsMapper.crmToModel.lastCall.args
      expect(contactData).to.equal(newContact)
    })

    test('returns the output from the mapper', async () => {
      expect(response).to.equal(contactModel)
    })
  })

  experiment('.patchContact', () => {
    beforeEach(async () => {
      sandbox.stub(contactsConnector, 'patchContact').resolves()

      await contactsService.patchContact('test-contact-id', { firstName: 'Potato' })
    })

    test('the id is passed to the connector', () => {
      const [id, payload] = contactsConnector.patchContact.lastCall.args
      expect(id).to.equal('test-contact-id')
      expect(payload).to.equal({ firstName: 'Potato' })
    })
  })

  experiment('.deleteContact', () => {
    beforeEach(async () => {
      sandbox.stub(contactsConnector, 'deleteContact').resolves()

      await contactsService.deleteContact({ id: 'test-contact-id' })
    })

    test('the id is passed to the connector', () => {
      const [passedId] = contactsConnector.deleteContact.lastCall.args
      expect(passedId).to.equal('test-contact-id')
    })
  })

  experiment('.getContactModel', () => {
    let contactData, contactModel, response
    const contactId = uuid()

    beforeEach(async () => {
      sandbox.stub(contactsMapper, 'uiToModel').resolves()
    })

    experiment('when only an contact id is provided', () => {
      beforeEach(async () => {
        contactData = {
          contactId
        }
        contactModel = new Contact(contactId)
        contactsMapper.uiToModel.returns(contactModel)
        response = await contactsService.getContactModel(contactData)
      })
      test('calls the contact mapper to map data from the ui', async () => {
        const [passedData] = contactsMapper.uiToModel.lastCall.args
        expect(passedData).to.equal(contactData)
      })

      test('returns the output from the mapper', async () => {
        expect(response).to.equal(contactModel)
      })
    })

    experiment('when new contact data is provided', () => {
      beforeEach(async () => {
        contactData = {
          type: 'person',
          firstName: 'Tommy',
          lastName: 'Testington',
          dataSource: Contact.DATA_SOURCE_TYPES.wrls
        }
        contactModel = new Contact()
        contactModel.fromHash(contactData)
        contactsMapper.uiToModel.returns(contactModel)

        response = await contactsService.getContactModel(contactData)
      })
      test('calls the contact mapper to map data from the ui', async () => {
        const [passedData] = contactsMapper.uiToModel.lastCall.args
        expect(passedData).to.equal(contactData)
      })

      test('returns the output from the mapper', async () => {
        expect(response).to.equal(contactModel)
      })

      test('throws an invalid entity error when the contact data is invalid', async () => {
        contactData = {
          type: 'person',
          lastName: 'Testington'
        }
        contactModel = new Contact()
        contactModel.fromHash(contactData)
        contactsMapper.uiToModel.returns(contactModel)

        try {
          await contactsService.getContactModel(contactData)
        } catch (err) {
          expect(err).to.be.instanceOf(InvalidEntityError)
          expect(err.message).to.equal('Invalid contact')
        }
      })
    })

    test('handles null company', async () => {
      response = await contactsService.getContactModel(null)
      expect(response).to.be.null()
    })
  })
})
