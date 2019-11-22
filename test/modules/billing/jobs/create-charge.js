const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { logger } = require('../../../../src/logger');
const createChargeJob = require('../../../../src/modules/billing/jobs/create-charge');

experiment('modules/billing/jobs/create-charge', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(createChargeJob.jobName).to.equal('billing.create-charge');
  });

  experiment('.createMessage', () => {
    test('creates the expected message object', async () => {
      const message = createChargeJob.createMessage(
        'test-event-id',
        { billing_batch_id: 'test-batch-id' },
        { billing_transaction_id: 'test-transaction-id' }
      );

      expect(message).to.equal({
        name: 'billing.create-charge',
        data: {
          eventId: 'test-event-id',
          batch: {
            billing_batch_id: 'test-batch-id'
          },
          transaction: {
            billing_transaction_id: 'test-transaction-id'
          }
        }
      });
    });
  });
});
