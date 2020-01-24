const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const event = require('../../../../src/lib/event');
const eventService = require('../../../../src/modules/billing/services/event-service');

experiment('modules/billing/services/event-service', () => {
  experiment('.getEventForBatch', () => {
    let batchId;
    let eventId;

    beforeEach(async () => {
      eventId = uuid();
      batchId = uuid();

      sandbox.stub(event.repo, 'find').resolves({
        rows: [
          { event_id: eventId }
        ]
      });
    });

    afterEach(async () => {
      sandbox.restore();
    });

    experiment('.getEventForBatch', () => {
      test('provides the expected query filter', async () => {
        await eventService.getEventForBatch(batchId);

        const [filter] = event.repo.find.lastCall.args;
        expect(filter.type).to.equal('billing-batch');
        expect(filter["metadata->'batch'->>'billing_batch_id'"]).to.equal(batchId);
      });

      test('returns null if no data is returned', async () => {
        event.repo.find.resolves({
          rows: []
        });

        const result = await eventService.getEventForBatch(batchId);
        expect(result).to.be.null();
      });

      test('returns the data if found', async () => {
        const result = await eventService.getEventForBatch(batchId);
        expect(result.event_id).to.equal(eventId);
      });
    });
  });
});
