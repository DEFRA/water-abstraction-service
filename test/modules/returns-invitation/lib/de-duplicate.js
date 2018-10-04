const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const {
  dedupe,
  getContactId,
  getPreferredContact,
  transformContact
} = require('../../../../src/modules/returns-invitation/lib/de-duplicate.js');

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

experiment('De-duplication', () => {
  test('It should de-duplicate when contact is the same and in the same group', async () => {
    const contacts = [createContact('A', 'A', 'A'), createContact('A', 'A', 'B')];
    const result = dedupe(contacts, getContactId);
    expect(result).to.equal([
      {
        'contact': {
          'name': 'Bob',
          'address_line_1': 'Daisy Farm',
          'postcode': 'DD1 1DD'
        },
        'data': [
          {
            'licence_ref': 'A'
          },
          {
            'licence_ref': 'B'
          }
        ]
      }
    ]);
  });

  test('It should not de-duplicate when contact is different and in the same group', async () => {
    const contacts = [createContact('A', 'A', 'A'), createContact('B', 'A', 'B')];
    const result = dedupe(contacts, getContactId);
    expect(result).to.equal([
      {
        'contact': {
          'name': 'Bob',
          'address_line_1': 'Daisy Farm',
          'postcode': 'DD1 1DD'
        },
        'data': [
          {
            'licence_ref': 'A'
          }
        ]
      },
      {
        'contact': {
          'name': 'Dave',
          'address_line_1': 'Buttercup Farm',
          'postcode': 'BB1 1BB'
        },
        'data': [
          {
            'licence_ref': 'B'
          }
        ]
      }
    ]);
  });

  test('It should not de-duplicate when contact is the same and in different group', async () => {
    const contacts = [createContact('A', 'A', 'A'), createContact('A', 'B', 'B')];
    const result = dedupe(contacts, getContactId);
    expect(result).to.equal([
      {
        'contact': {
          'name': 'Bob',
          'address_line_1': 'Daisy Farm',
          'postcode': 'DD1 1DD'
        },
        'data': [
          {
            'licence_ref': 'A'
          }
        ]
      },
      {
        'contact': {
          'name': 'Bob',
          'address_line_1': 'Daisy Farm',
          'postcode': 'DD1 1DD'
        },
        'data': [
          {
            'licence_ref': 'B'
          }
        ]
      }
    ]);
  });
});

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
    expect(contact).to.equal({ name: 'Bob',
      address_line_1: 'Daisy Farm',
      postcode: 'DD1 1DD',
      role: 'licence_holder' });
  });

  test('It should select preferred contact by role', async () => {
    const contact = getPreferredContact(contacts, ['returns_contact', 'licence_holder']);
    expect(contact).to.equal({ name: 'Dave',
      address_line_1: 'Buttercup Farm',
      postcode: 'BB1 1BB',
      role: 'returns_contact' });
  });

  test('It should return nothing if no contact found', async () => {
    const contact = getPreferredContact(contacts, ['no_contacts_with_this_role']);
    expect(contact).to.equal(undefined);
  });
});

experiment('transformContact', () => {
  const contactA = createContact('A', 'A', 'A', 'licence_holder').contact;
  const contactB = createContact('B', 'A', 'A', 'returns_contact').contact;

  const data = {
    contacts: [contactA, contactB],
    licence_ref: '01/234',
    return_id: '01:234:5678'
  };

  test('It should select the correct contact and transform the data to contain { data, contact, group }', async () => {
    const transformed = transformContact(data, ['returns_contact', 'licence_holder']);
    expect(transformed).to.equal({ data: { licence_ref: '01/234', return_id: '01:234:5678' },
      contact:
     { name: 'Dave',
       address_line_1: 'Buttercup Farm',
       postcode: 'BB1 1BB',
       role: 'returns_contact' },
      group: '8c2446dc404209c8b0fd6310dd08f2f765778bc0' });
  });
});
