const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const repos = require('../../../src/lib/connectors/repository');

const registerSubscribers = require('../../../src/modules/billing/register-subscribers');
const populateBatchChargeVersions = require('../../../src/modules/billing/jobs/populate-batch-charge-versions');
const processChargeVersions = require('../../../src/modules/billing/jobs/process-charge-versions');

experiment('modules/billing/register-subscribers', () => {
  let server;
  let onCompleteHandlers;

  beforeEach(async () => {
    sandbox.stub(repos.billingBatchChargeVersionYears, 'create').resolves();
    sandbox.stub(repos.billingBatchChargeVersionYears, 'findProcessingByBatch').resolves({
      rowCount: 10
    });
    sandbox.stub(repos.billingBatches, 'setStatus').resolves();

    onCompleteHandlers = {};
    server = {
      messageQueue: {
        subscribe: sandbox.stub().resolves(),
        onComplete: sandbox.stub().callsFake((jobName, handler) => {
        // capture the assigned handlers for later testing
          onCompleteHandlers[jobName] = handler;
          return Promise.resolve();
        }),
        publish: sandbox.stub().resolves()
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('plugin has a name', async () => {
    expect(registerSubscribers.name).to.equal('billingRegisterSubscribers');
  });

  test('plugin has a register function', async () => {
    expect(registerSubscribers.register).to.be.a.function();
  });

  experiment('when the plugin is registered with the server', async () => {
    beforeEach(async () => {
      await registerSubscribers.register(server);
    });

    test('the populate billing batch charge versions job is registered', async () => {
      expect(server.messageQueue.subscribe.calledWith(
        populateBatchChargeVersions.jobName, populateBatchChargeVersions.handler
      )).to.be.true();
    });
  });

  experiment('onComplete : processChargeVersions', () => {
    experiment('if there are more charge version years to process', () => {
      test('the batch status is not updated', async () => {
        await registerSubscribers.register(server);
        await onCompleteHandlers[processChargeVersions.jobName]({
          data: {
            response: {
              chargeVersionYear: {
                billing_batch_id: 'test-batch-id'
              }
            }
          }
        });

        expect(repos.billingBatchChargeVersionYears.findProcessingByBatch.calledWith('test-batch-id')).to.be.true();
        expect(repos.billingBatches.setStatus.called).to.be.false();
      });
    });

    experiment('if all the charge version years have been processed', () => {
      test('the batch status is updated', async () => {
        repos.billingBatchChargeVersionYears.findProcessingByBatch.resolves({
          rowCount: 0
        });
        await registerSubscribers.register(server);
        await onCompleteHandlers[processChargeVersions.jobName]({
          data: {
            response: {
              chargeVersionYear: {
                billing_batch_id: 'test-batch-id'
              }
            }
          }
        });

        expect(repos.billingBatchChargeVersionYears.findProcessingByBatch.calledWith('test-batch-id')).to.be.true();
        expect(repos.billingBatches.setStatus.calledWith('test-batch-id', 'complete')).to.be.true();
      });
    });
  });

  experiment('onComplete : populateBatchChargeVersions', () => {
    experiment('if the job created charge versions', () => {
      beforeEach(async () => {
        const job = {
          data: {
            request: {
              data: { eventId: 'test-event-id' }
            },
            response: {
              chargeVersions: [
                {
                  charge_version_id: 'test-charge-version-id-1',
                  billing_batch_id: 'test-batch-id'
                },
                {
                  charge_version_id: 'test-charge-version-id-2',
                  billing_batch_id: 'test-batch-id'
                }
              ],
              batch: {
                billing_batch_id: 'test-batch-id',
                start_financial_year: 2019,
                end_financial_year: 2020
              }
            }
          }
        };

        await registerSubscribers.register(server);
        await onCompleteHandlers[populateBatchChargeVersions.jobName](job);
      });

      test('a charge version year is created for each year in the batch range', async () => {
        expect(repos.billingBatchChargeVersionYears.create.calledWith({
          billing_batch_id: 'test-batch-id',
          charge_version_id: 'test-charge-version-id-1',
          financial_year: 2019,
          status: 'processing'
        })).to.be.true();

        expect(repos.billingBatchChargeVersionYears.create.calledWith({
          billing_batch_id: 'test-batch-id',
          charge_version_id: 'test-charge-version-id-1',
          financial_year: 2020,
          status: 'processing'
        })).to.be.true();

        expect(repos.billingBatchChargeVersionYears.create.calledWith({
          billing_batch_id: 'test-batch-id',
          charge_version_id: 'test-charge-version-id-2',
          financial_year: 2019,
          status: 'processing'
        })).to.be.true();

        expect(repos.billingBatchChargeVersionYears.create.calledWith({
          billing_batch_id: 'test-batch-id',
          charge_version_id: 'test-charge-version-id-2',
          financial_year: 2020,
          status: 'processing'
        })).to.be.true();
      });

      test('a message is published to process each charge version year entry', async () => {
        const [message] = server.messageQueue.publish.lastCall.args;

        expect(message.name).to.equal(processChargeVersions.jobName);
        expect(message.data.eventId).to.equal('test-event-id');
      });
    });

    experiment('if no charge versions were found', () => {
      test('the populateBatchTransactions job is not published', async () => {
        const job = {
          data: {
            request: {
              data: { eventId: 'test-event-id' }
            },
            response: { chargeVersions: [] }
          }
        };

        await registerSubscribers.register(server);
        await onCompleteHandlers[populateBatchChargeVersions.jobName](job);
        expect(server.messageQueue.publish.called).to.be.false();
      });
    });
  });
});
