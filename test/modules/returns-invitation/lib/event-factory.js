const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const {
  eventFactory
} = require('../../../../src/modules/returns-invitation/lib/event-factory');

const { state } = require('./test-data');

experiment('eventFactory', () => {
  test('It should create an event object given a return notification state object', async () => {
    const ev = eventFactory(state);
    expect(ev).to.equal({ event_id: 'event_id',
      subtype: 'template_name',
      issuer: 'mail@example.com',
      licences: [ 'licence_a', 'licence_b', 'licence_c', 'licence_d' ],
      entities: [ 'entity_a', 'entity_b', 'entity_c' ],
      metadata: { name: 'Test notification', recipients: 3, sent: 0, error: 0 },
      status: '' });
  });
});
