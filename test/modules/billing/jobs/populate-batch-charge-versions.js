const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const repos = require('../../../../src/lib/connectors/repository');
const messageQueue = require('../../../../src/lib/message-queue');
const event = require('../../../../src/lib/event');
const populateBatchChargeVersionsJob = require('../../../../src/modules/billing/jobs/populate-batch-charge-versions');

experiment('modules/billing/jobs/populate-batch-charge-versions', () => {
  beforeEach(async () => {
    sandbox.stub(messageQueue, 'publish').resolves();
    sandbox.stub(event, 'save').resolves();
    sandbox.stub(event, 'load').resolves({
      event_id: '00000000-0000-0000-0000-000000000000'
    });
    sandbox.stub(repos.chargeVersions, 'createSupplementaryChargeVersions').resolves([]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(populateBatchChargeVersionsJob.jobName).to.equal('billing.populate-batch-charge-versions');
  });

  experiment('.createMessage', () => {
    test('creates the expected request object', async () => {
      const message = populateBatchChargeVersionsJob.createMessage('test-event-id');
      expect(message.name).to.equal('billing.populate-batch-charge-versions');
      expect(message.data).to.equal({
        eventId: 'test-event-id'
      });
    });
  });

  experiment('.handler', () => {
    let job;

    experiment('when the batch is supplementary', () => {
      beforeEach(async () => {
        job = {
          data: {
            eventId: '22222222-2222-2222-2222-222222222222'
          },
          done: sandbox.spy()
        };

        event.load.resolves({
          metadata: {
            batch: {
              batch_type: 'supplementary'
            }
          }
        });
      });

      experiment('if there are charge versions for the batch', () => {
        beforeEach(async () => {
          repos.chargeVersions.createSupplementaryChargeVersions.resolves([
            { charge_version_id: 1 }, { charge_version_id: 2 }
          ]);

          await populateBatchChargeVersionsJob.handler(job);
        });

        test('the event is saved with the expected status', async () => {
          const [batchEvent] = event.save.lastCall.args;
          expect(batchEvent.status).to.equal('processing');
        });

        test('the job is completed and includes the rows', async () => {
          const [err, { chargeVersions }] = job.done.lastCall.args;
          expect(err).to.be.null();
          expect(chargeVersions).to.equal([
            { charge_version_id: 1 },
            { charge_version_id: 2 }
          ]);
        });
      });

      experiment('if there are no charge versions for the batch', () => {
        beforeEach(async () => {
          repos.chargeVersions.createSupplementaryChargeVersions.resolves([]);

          await populateBatchChargeVersionsJob.handler(job);
        });

        test('the event is saved with the expected status', async () => {
          const [batchEvent] = event.save.lastCall.args;
          expect(batchEvent.status).to.equal('complete');
        });

        test('the job is completed and includes the row count', async () => {
          const [err, { chargeVersions }] = job.done.lastCall.args;
          expect(err).to.be.null();
          expect(chargeVersions).to.equal([]);
        });
      });
    });
  });
});
