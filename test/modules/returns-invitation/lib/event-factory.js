const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const {
  eventFactory
} = require('../../../../src/modules/returns-invitation/lib/event-factory');

const { state } = require('./test-data');

experiment('eventFactory', () => {
  test('It should create an event object given a return notification state object', async () => {
    const ev = eventFactory(state);

    expect(ev.eventId).to.equal('event_id');
    expect(ev.subtype).to.equal('template_name');
    expect(ev.issuer).to.equal('mail@example.com');
    expect(ev.licences).to.equal([ 'licence_a', 'licence_b', 'licence_c', 'licence_d' ]);
    expect(ev.entities).to.equal([ 'entity_a', 'entity_b', 'entity_c' ]);
    expect(ev.metadata).to.equal({ name: 'Test notification', recipients: 3, sent: 0, error: 0 });
    expect(ev.status).to.equal('');
  });
});
