const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { createContacts, _mapType } = require('../../../../src/lib/models/factory/crm-contact-list');
const {
  CONTACT_ROLE_LICENCE_HOLDER, CONTACT_ROLE_RETURNS_TO,
  CONTACT_ROLE_PRIMARY_USER, CONTACT_ROLE_AGENT, CONTACT_ROLE_RETURNS_AGENT,
  CONTACT_TYPE_PERSON, CONTACT_TYPE_ORGANISATION
} = require('../../../../src/lib/models/contact');

const createContact = role => ({
  entity_id: null,
  source: 'nald',
  email: null,
  role: role,
  address_1: 'Daisy meadow farm',
  address_2: 'Buttercup road',
  address_3: 'Big stony hill',
  address_4: 'Little test',
  initials: null,
  name: 'Daisy Farms Estate Company',
  town: 'Testing',
  county: 'TESTINGSHIRE',
  country: 'UK',
  forename: null,
  postcode: 'TT1 1TT',
  salutation: null
});

const createLicenceHolder = () => createContact('licence_holder');
const createReturnsTo = () => ({
  ...createContact('returns_to'),
  initials: 'J',
  forename: 'John',
  name: 'Doe',
  salutation: 'Sir'
});

const createPrimaryUser = () => ({
  ...createContact('primary_user'),
  entity_id: 'c934c1e3-5973-4fc7-b401-063867fdbfe5',
  email: 'primary@example.com'
});

const createAgent = () => ({
  ...createContact('user'),
  entity_id: '326df038-71c6-44e7-8f13-ee548fdc9fce',
  email: 'agent@example.com'
});

const createReturnsAgent = () => ({
  ...createContact('user_returns'),
  entity_id: 'c6658dee-078d-4e8d-9254-155b84ece44d',
  email: 'returns-agent@example.com'
});

experiment('CRMContactList', () => {
  let contacts, list;

  experiment('_mapType', () => {
    test('the type is "organisation" when the contact has an entity ID and a role of "company"', async () => {
      const result = _mapType({
        entity_id: 'entity_1',
        role: 'company'
      });
      expect(result).to.equal(CONTACT_TYPE_ORGANISATION);
    });

    test('the type is "person" when the contact has an entity ID and a role that is not "company"', async () => {
      const result = _mapType({
        entity_id: 'entity_1',
        role: 'primary_user'
      });
      expect(result).to.equal(CONTACT_TYPE_PERSON);
    });

    test('the type is "organisation" when the contact has no entity ID and no initials/forename/salutation', async () => {
      const result = _mapType({
        name: 'Big Water Co',
        initials: null,
        forename: null,
        salutation: null
      });
      expect(result).to.equal(CONTACT_TYPE_ORGANISATION);
    });

    test('the type is "person" when the contact has no entity ID and has initials/forename/salutation', async () => {
      const result = _mapType({
        name: 'Smith',
        forename: 'Jasmine',
        initials: 'J'
      });
      expect(result).to.equal(CONTACT_TYPE_PERSON);
    });
  });

  experiment('createContacts', () => {
    beforeEach(async () => {
      contacts = [
        createLicenceHolder(),
        createReturnsTo(),
        createPrimaryUser(),
        createAgent(),
        createReturnsAgent()
      ];
      list = createContacts(contacts);
    });

    test('contacts have the correct role', async () => {
      const roles = list.toArray().map(item => item.role);
      expect(roles).to.equal([
        CONTACT_ROLE_LICENCE_HOLDER, CONTACT_ROLE_RETURNS_TO,
        CONTACT_ROLE_PRIMARY_USER, CONTACT_ROLE_AGENT, CONTACT_ROLE_RETURNS_AGENT
      ]);
    });

    test('contacts have the correct type', async () => {
      const roles = list.toArray().map(item => item.type);
      expect(roles).to.equal([
        CONTACT_TYPE_ORGANISATION, CONTACT_TYPE_PERSON,
        CONTACT_TYPE_PERSON, CONTACT_TYPE_PERSON, CONTACT_TYPE_PERSON
      ]);
    });

    test('address fields are correctly mapped', async () => {
      const [contact] = list.toArray();
      expect(contact.addressLine1).to.equal(contacts[0].address_1);
      expect(contact.addressLine2).to.equal(contacts[0].address_2);
      expect(contact.addressLine3).to.equal(contacts[0].address_3);
      expect(contact.addressLine4).to.equal(contacts[0].address_4);
      expect(contact.town).to.equal(contacts[0].town);
      expect(contact.county).to.equal(contacts[0].county);
      expect(contact.postcode).to.equal(contacts[0].postcode);
      expect(contact.country).to.equal(contacts[0].country);
    });

    test('name fields are correctly mapped for a person', async () => {
      const [, contact] = list.toArray();
      expect(contact.salutation).to.equal(contacts[1].salutation);
      expect(contact.firstName).to.equal(contacts[1].forename);
      expect(contact.name).to.equal(contacts[1].name);
      expect(contact.initials).to.equal(contacts[1].initials);
    });

    test('name fields are correctly mapped for an organisation', async () => {
      const [contact] = list.toArray();
      expect(contact.salutation).to.be.null();
      expect(contact.firstName).to.be.null();
      expect(contact.name).to.equal(contacts[0].name);
      expect(contact.initials).to.be.null();
    });

    test('email address is correctly mapped for a service user', async () => {
      const [,, contact] = list.toArray();
      expect(contact.email).to.be.equal(contacts[2].email);
    });
  });
});
