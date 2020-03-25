const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const notificationRecipients = require('../../../../../../src/modules/batch-notifications/config/returns/lib/return-notification-recipients');

const ContactList = require('../../../../../../src/lib/models/contact-list');
const Contact = require('../../../../../../src/lib/models/contact');

experiment('modules/batch-notifications/config/return-invitation/return-notification-recipients', () => {
  const licenceHolder = new Contact({
    role: Contact.CONTACT_ROLE_LICENCE_HOLDER,
    name: 'John Doe'
  });
  const returnsTo = new Contact({
    role: Contact.CONTACT_ROLE_RETURNS_TO,
    name: 'Jane Doe'
  });
  const returnsToWithDuplicateDetails = new Contact({
    role: Contact.CONTACT_ROLE_RETURNS_TO,
    name: 'John Doe'
  });
  const primaryUser = new Contact({
    role: Contact.CONTACT_ROLE_PRIMARY_USER,
    email: 'primary@example.com'
  });
  const agent = new Contact({
    role: Contact.CONTACT_ROLE_AGENT,
    email: 'agent@example.com'
  });
  const returnsAgent = new Contact({
    role: Contact.CONTACT_ROLE_RETURNS_AGENT,
    email: 'returnsagent@example.com'
  });

  experiment('_getPreferredContacts', () => {
    test('when there is only a licence holder, sends to licence holder only', async () => {
      const list = new ContactList([licenceHolder]);
      const result = notificationRecipients._getPreferredContacts(list);
      expect(result.length).to.equal(1);
      expect(result[0].role).to.equal(Contact.CONTACT_ROLE_LICENCE_HOLDER);
    });

    test('when there is a licence holder and returns contact, sends to both', async () => {
      const list = new ContactList([licenceHolder, returnsTo]);
      const result = notificationRecipients._getPreferredContacts(list);
      expect(result.length).to.equal(2);
      expect(result[0].role).to.equal(Contact.CONTACT_ROLE_LICENCE_HOLDER);
      expect(result[1].role).to.equal(Contact.CONTACT_ROLE_RETURNS_TO);
    });

    test('when there is a licence holder and multiple returns contacts, sends to all', async () => {
      const list = new ContactList([licenceHolder, returnsTo, returnsTo]);
      const result = notificationRecipients._getPreferredContacts(list);
      expect(result.length).to.equal(3);
      expect(result[0].role).to.equal(Contact.CONTACT_ROLE_LICENCE_HOLDER);
      expect(result[1].role).to.equal(Contact.CONTACT_ROLE_RETURNS_TO);
      expect(result[2].role).to.equal(Contact.CONTACT_ROLE_RETURNS_TO);
    });

    test('when there is a primary user, send to them only', async () => {
      const list = new ContactList([licenceHolder, returnsTo, primaryUser]);
      const result = notificationRecipients._getPreferredContacts(list);
      expect(result.length).to.equal(1);
      expect(result[0].role).to.equal(Contact.CONTACT_ROLE_PRIMARY_USER);
    });

    test('when there is a primary user and agent send to primary user only', async () => {
      const list = new ContactList([licenceHolder, returnsTo, primaryUser, agent]);
      const result = notificationRecipients._getPreferredContacts(list);
      expect(result.length).to.equal(1);
      expect(result[0].role).to.equal(Contact.CONTACT_ROLE_PRIMARY_USER);
    });

    test('when there is a primary user and returns agent, send to returns agent only', async () => {
      const list = new ContactList([licenceHolder, returnsTo, primaryUser, agent, returnsAgent]);
      const result = notificationRecipients._getPreferredContacts(list);
      expect(result.length).to.equal(1);
      expect(result[0].role).to.equal(Contact.CONTACT_ROLE_RETURNS_AGENT);
    });

    test('when there is a primary user and multiple returns agents, send to all returns agents', async () => {
      const list = new ContactList([licenceHolder, returnsTo, primaryUser, agent, returnsAgent, returnsAgent]);
      const result = notificationRecipients._getPreferredContacts(list);
      expect(result.length).to.equal(2);
      expect(result[0].role).to.equal(Contact.CONTACT_ROLE_RETURNS_AGENT);
      expect(result[1].role).to.equal(Contact.CONTACT_ROLE_RETURNS_AGENT);
    });
  });

  experiment('getRecipientList', () => {
    let result;

    const returnContacts = [{
      licenceNumber: 'licence_1',
      returns: [{
        return_id: 'return_1'
      }, {
        return_id: 'return_2'
      }],
      contacts: new ContactList([
        licenceHolder
      ])
    }, {
      licenceNumber: 'licence_2',
      returns: [{
        return_id: 'return_3'
      }],
      contacts: new ContactList([
        licenceHolder,
        returnsToWithDuplicateDetails
      ])
    }, {
      licenceNumber: 'licence_3',
      returns: [{
        return_id: 'return_4'
      }],
      contacts: new ContactList([
        licenceHolder,
        primaryUser,
        returnsAgent
      ])
    }, {
      licenceNumber: 'licence_4',
      returns: [{
        return_id: 'return_5'
      }],
      contacts: new ContactList([
        primaryUser
      ])
    }];

    beforeEach(async () => {
      result = notificationRecipients.getRecipientList(returnContacts);
    });

    test('4 recipients are identified', async () => {
      expect(result.length).to.equal(4);
    });

    test('John Doe gets one message for their licence holder role', async () => {
      expect(result[0].licenceNumbers).to.equal(['licence_1', 'licence_2']);
      expect(result[0].contact.role).to.equal(Contact.CONTACT_ROLE_LICENCE_HOLDER);
      expect(result[0].contact.name).to.equal('John Doe');
      expect(result[0].returnIds).to.equal(['return_1', 'return_2', 'return_3']);
    });

    test('John Doe gets one message for their returns contact role', async () => {
      expect(result[1].licenceNumbers).to.equal(['licence_2']);
      expect(result[1].contact.role).to.equal(Contact.CONTACT_ROLE_RETURNS_TO);
      expect(result[1].contact.name).to.equal('John Doe');
      expect(result[1].returnIds).to.equal(['return_3']);
    });

    test('primary@example.com gets one message for their primary user role', async () => {
      expect(result[3].licenceNumbers).to.equal(['licence_4']);
      expect(result[3].contact.role).to.equal(Contact.CONTACT_ROLE_PRIMARY_USER);
      expect(result[3].contact.email).to.equal('primary@example.com');
      expect(result[3].returnIds).to.equal(['return_5']);
    });

    test('returnsagent@example.com gets one message for their returns agent role', async () => {
      expect(result[2].licenceNumbers).to.equal(['licence_3']);
      expect(result[2].contact.role).to.equal(Contact.CONTACT_ROLE_RETURNS_AGENT);
      expect(result[2].contact.email).to.equal('returnsagent@example.com');
      expect(result[2].returnIds).to.equal(['return_4']);
    });
  });
});
