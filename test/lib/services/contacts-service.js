const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const uuid = require('uuid/v4');
const contactsService = require('../../../src/lib/services/contacts-service');
const Contact = require('../../../src/lib/models/contact-v2');
const contactsConnector = require('../../../src/lib/connectors/crm-v2/contacts');
const contactsMapper = require('../../../src/lib/mappers/contact');

experiment('modules/billing/services/contacts-service', () => {
  let connectorResponse;
  beforeEach(async () => {
    connectorResponse = [
      { contactId: uuid(), initials: 'AB', salutation: 'Mr', firstName: 'Testy', lastName: 'Mc Testface' },
      { contactId: uuid(), initials: 'BC', salutation: 'Mrs', firstName: 'Testy', lastName: 'Mc Testface' }
    ];
    sandbox.stub(contactsConnector, 'getContacts').resolves(connectorResponse);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getContacts', () => {
    test('passes the contactIds to the connector', async () => {
      const ids = [uuid()];
      await contactsService.getContacts(ids);

      const [passedIds] = contactsConnector.getContacts.lastCall.args;

      expect(passedIds).to.equal(ids);
    });

    test('returns the data as Contact objects', async () => {
      const response = await contactsService.getContacts([uuid()]);
      expect(response[0]).to.be.an.instanceOf(Contact);
      expect(response[0].id).to.equal(connectorResponse[0].contactId);
      expect(response[0].title).to.equal(connectorResponse[0].salutation);
      expect(response[0].initials).to.equal(connectorResponse[0].initials);
      expect(response[0].firstName).to.equal(connectorResponse[0].firstName);
      expect(response[0].lastName).to.equal(connectorResponse[0].lastName);

      expect(response[1]).to.be.an.instanceOf(Contact);
      expect(response[1].id).to.equal(connectorResponse[1].contactId);
      expect(response[1].title).to.equal(connectorResponse[1].salutation);
      expect(response[1].initials).to.equal(connectorResponse[1].initials);
      expect(response[1].firstName).to.equal(connectorResponse[1].firstName);
      expect(response[1].lastName).to.equal(connectorResponse[1].lastName);
    });
  });

  experiment('.createContact', () => {
    const contactId = uuid();
    let contactData, mappedData, newContact, contactModel, response;
    beforeEach(async () => {
      contactData = {
        title: 'Mr',
        firstName: 'John',
        lastName: 'Test'
      };
      mappedData = {
        salutation: 'Mr',
        firstName: 'John',
        lastName: 'Test'
      };
      newContact = {
        contactId: contactId,
        salutation: 'Mr',
        firstName: 'John',
        lastName: 'Test'
      };
      contactModel = new Contact(contactId);
      sandbox.stub(contactsMapper, 'serviceToCrm').returns(mappedData);
      sandbox.stub(contactsMapper, 'crmToModel').resolves(contactModel);

      sandbox.stub(contactsConnector, 'createContact').resolves(newContact);

      response = await contactsService.createContact(contactData);
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('calls the address mapper to map data for the DB call', async () => {
      const [passedData] = contactsMapper.serviceToCrm.lastCall.args;
      expect(passedData).to.equal(contactData);
    });

    test('calls the address connector with the mapped data', async () => {
      const [contactData] = contactsConnector.createContact.lastCall.args;
      expect(contactData).to.equal(mappedData);
    });

    test('calls the crm to model mapper with the output of the crm call', async () => {
      const [contactData] = contactsMapper.crmToModel.lastCall.args;
      expect(contactData).to.equal(newContact);
    });

    test('returns the output from the mapper', async () => {
      expect(response).to.equal(contactModel);
    });
  });
});
