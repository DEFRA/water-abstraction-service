const licenceData = require('../../../responses/permits/licence/licence-data.json');

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { createContacts } = require('../../../../src/lib/models/factory/contact-list');

experiment('ContactList factory', () => {
  test('should create a ContactList with 2 contacts from NALD JSON data', async () => {
    const contactList = createContacts(licenceData);
    const contacts = contactList.toArray();
    expect(contacts.length).to.equal(2);
  });

  test('the first contact should be the licence holder', async () => {
    const contactList = createContacts(licenceData);
    const [licenceHolder] = contactList.toArray();
    expect(licenceHolder.role).to.equal('Licence holder');
  });

  test('the second contact should be a licence contact', async () => {
    const contactList = createContacts(licenceData);
    const [, licenceContact] = contactList.toArray();
    expect(licenceContact.role).to.equal('Licence contact');
  });
});
