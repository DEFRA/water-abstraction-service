const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const {
  eventFactory
} = require('../../../../src/modules/returns-invitation/lib/event-factory');

experiment('eventFactory', () => {
  const state = {
    config: {
      name: 'Test notification',
      messageRef: {
        default: 'template_name'
      },
      issuer: 'mail@example.com'
    },
    event: {
      event_id: 'event_id'
    },
    contacts: [{
      entity_id: 'entity_a',
      data: {
        system_external_id: 'licence_a'
      }
    }, {
      entity_id: 'entity_b',
      data: [{
        system_external_id: 'licence_b'
      }, {
        system_external_id: 'licence_c'
      }]
    }]

  };

  test('It should create an event object given a return notification state object', async () => {
    const ev = eventFactory(state);
    expect(ev).to.equal({ event_id: 'event_id',
      subtype: 'template_name',
      issuer: 'mail@example.com',
      licences: [ 'licence_a', 'licence_b', 'licence_c' ],
      entities: [ 'entity_a', 'entity_b' ],
      metadata: { name: 'Test notification', recipients: 2, sent: 0, error: 0 },
      status: '' });
  });
});
