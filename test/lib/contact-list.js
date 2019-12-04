const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const {
  getContactId,
  getPreferredContact
} = require('../../src/lib/contact-list');

const createContact = (contact, group, licenceRef, role) => {
  const contacts = {
    A: {
      name: 'Bob',
      address_line_1: 'Daisy Farm',
      postcode: 'DD1 1DD'
    },
    B: {
      name: 'Dave',
      address_line_1: 'Buttercup Farm',
      postcode: 'BB1 1BB'
    },
    C: {
      name: 'Katie',
      address_line_1: 'Lavender Farm',
      postcode: 'LL1 1LL'
    }
  };

  const selectedContact = contacts[contact];
  const contactWithRole = role ? { ...selectedContact, role } : selectedContact;

  return {
    contact: contactWithRole,
    data: {
      licence_ref: licenceRef
    },
    group
  };
};

experiment('getContactId', () => {
  test('It should create a contact ID when none is present', async () => {
    const contact = createContact('A', 'A', 'A');
    const contactId = getContactId(contact);
    expect(contactId).to.equal('d90742fb30bd56e913ed9ef6159cc4edef010a0c');
  });
  test('It should use entity ID if present', async () => {
    const entityId = 'ce0c2172-1589-4214-8d20-eab7760e87ce';
    const contact = {
      ...createContact('A', 'A', 'A'),
      entity_id: entityId
    };
    const contactId = getContactId(contact);
    expect(contactId).to.equal(entityId);
  });
});

experiment('getPreferredContact', () => {
  const contactA = createContact('A', 'A', 'A', 'licence_holder');
  const contactB = createContact('B', 'A', 'A', 'returns_contact');

  const contacts = [contactA, contactB].map(data => data.contact);

  test('It should select preferred contact by role', async () => {
    const contact = getPreferredContact(contacts, ['licence_holder', 'returns_contact']);
    expect(contact).to.equal({
      name: 'Bob',
      address_line_1: 'Daisy Farm',
      postcode: 'DD1 1DD',
      role: 'licence_holder'
    });
  });

  test('It should select preferred contact by role', async () => {
    const contact = getPreferredContact(contacts, ['returns_contact', 'licence_holder']);
    expect(contact).to.equal({
      name: 'Dave',
      address_line_1: 'Buttercup Farm',
      postcode: 'BB1 1BB',
      role: 'returns_contact'
    });
  });

  test('It should return nothing if no contact found', async () => {
    const contact = getPreferredContact(contacts, ['no_contacts_with_this_role']);
    expect(contact).to.equal(undefined);
  });
});
