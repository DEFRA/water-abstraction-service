const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const {
  messageFactory,
  formatName
} = require('../../../../src/modules/returns-invitation/lib/message-factory');

const { state } = require('./test-data');

experiment('messageFactory', () => {
  test('It should create a letter message to a postal contact', async () => {
    const { contacts: [ contact ] } = state;

    const msg = messageFactory(state, contact, { system_external_id: '01/123' });

    expect(msg).to.equal({ messageRef: 'template_name',
      recipient: 'n/a',
      personalisation:
   { address_line_2: 'Testington',
     address_line_1: 'Daisy Farm',
     postcode: 'DD1 1DD',
     system_external_id: '01/123'},
      sendAfter: undefined,
      licences: [ '01/123' ],
      individualEntityId: 'entity_a',
      eventId: 'event_id',
      messageType: 'letter' });
  });

  test('It should create a letter object to an email contact', async () => {
    const { contacts: [ contactA, contactB, contactC ] } = state;

    const msg = messageFactory(state, contactC, { system_external_id: '01/123' });

    expect(msg).to.equal({ messageRef: 'template_name',
      recipient: 'entity_c@example.com',
      personalisation: {
        postcode: undefined,
        system_external_id: '01/123'
      },
      sendAfter: undefined,
      licences: [ '01/123' ],
      individualEntityId: 'entity_c',
      eventId: 'event_id',
      messageType: 'email' });
  });
});

experiment('formatName', () => {
  const salutation = 'Mr';
  const forename = 'John';
  const initials = 'J';
  const name = 'Doe';

  test('For companies, it should return the name only', async () => {
    const contact = {
      salutation: null,
      forename: null,
      initials: null,
      name
    };
    expect(formatName(contact)).to.equal(contact.name);
  });

  test('If initials and forename are specified, it should use initials only', async () => {
    const contact = {
      salutation,
      forename,
      initials,
      name
    };
    expect(formatName(contact)).to.equal('Mr J Doe');
  });

  test('If should use forename if initials omitted', async () => {
    const contact = {
      salutation,
      forename,
      initials: null,
      name
    };
    expect(formatName(contact)).to.equal('Mr John Doe');
  });

  test('If should only use salutation and last name if forename and initials are omitted', async () => {
    const contact = {
      salutation,
      forename: null,
      initials: null,
      name
    };
    expect(formatName(contact)).to.equal('Mr Doe');
  });
});
