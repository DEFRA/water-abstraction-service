const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const {
  messageFactory
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
     postcode: 'DD1 1DD' },
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
      personalisation: { postcode: undefined },
      sendAfter: undefined,
      licences: [ '01/123' ],
      individualEntityId: 'entity_c',
      eventId: 'event_id',
      messageType: 'email' });
  });
});
