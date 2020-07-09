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
const contactsService = require('../../../../src/modules/billing/services/contacts-service');
const Contact = require('../../../../src/lib/models/contact-v2');
const contactsConnector = require('../../../../src/lib/connectors/crm-v2/contacts');

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
});
