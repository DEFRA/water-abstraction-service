const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const notificationRecipients = require('../../../../../../src/modules/batch-notifications/config/return-invitation/return-notification-recipients');

const ContactList = require('../../../../../../src/lib/models/contact-list');
const Contact = require('../../../../../../src/lib/models/contact');

experiment('modules/batch-notifications/config/return-invitation/return-notification-recipients', () => {
  const licenceHolder = new Contact({
    role: Contact.CONTACT_ROLE_LICENCE_HOLDER
  });
  const returnsTo = new Contact({
    role: Contact.CONTACT_ROLE_RETURNS_TO
  });
  const primaryUser = new Contact({
    role: Contact.CONTACT_ROLE_PRIMARY_USER
  });
  const agent = new Contact({
    role: Contact.CONTACT_ROLE_AGENT
  });
  const returnsAgent = new Contact({
    role: Contact.CONTACT_ROLE_RETURNS_AGENT
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

    test('when there is a primary user and returns agent, send to both', async () => {
      const list = new ContactList([licenceHolder, returnsTo, primaryUser, agent, returnsAgent]);
      const result = notificationRecipients._getPreferredContacts(list);
      expect(result.length).to.equal(2);
      expect(result[0].role).to.equal(Contact.CONTACT_ROLE_PRIMARY_USER);
      expect(result[1].role).to.equal(Contact.CONTACT_ROLE_RETURNS_AGENT);
    });

    test('when there is a primary user and multiple returns agents, send to all', async () => {
      const list = new ContactList([licenceHolder, returnsTo, primaryUser, agent, returnsAgent, returnsAgent]);
      const result = notificationRecipients._getPreferredContacts(list);
      expect(result.length).to.equal(3);
      expect(result[0].role).to.equal(Contact.CONTACT_ROLE_PRIMARY_USER);
      expect(result[1].role).to.equal(Contact.CONTACT_ROLE_RETURNS_AGENT);
      expect(result[2].role).to.equal(Contact.CONTACT_ROLE_RETURNS_AGENT);
    });
  });
});
