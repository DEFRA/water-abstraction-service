const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const eventService = require('../../../../src/lib/services/events');
const eventHelper = require('../../../../src/modules/licences/lib/event-helper');

experiment('modules/licences/lib/event-helper', () => {
  experiment('.saveEvent', () => {
    let eventData;

    beforeEach(async () => {
      sandbox.stub(eventService, 'create').resolves({ eventId: 'test-id' });
      const metadata = { data: 'meta' };
      eventData = await eventHelper.saveEvent('type', 'subtype', ['licence-number'], 'status', 'user@test.com', metadata);
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('returns true when the start dates match and there is no end date', async () => {
      expect(eventData.eventId).to.equal('test-id');
    });
  });
});
