const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const populateBatchChargeVersions = require('../../../../src/modules/billing/jobs/populate-batch-charge-versions');
const populateBatchTransactions = require('../../../../src/modules/billing/jobs/populate-batch-transactions');
const init = require('../../../../src/modules/billing/jobs/init');

experiment('modules/billing/jobs/init', () => {
  let messageQueue;
  let onCompleteHandlers;

  beforeEach(async () => {
    onCompleteHandlers = {};
    messageQueue = {
      subscribe: sandbox.stub().resolves(),
      onComplete: sandbox.stub().callsFake((jobName, handler) => {
        // capture the assigned handlers for later testing
        onCompleteHandlers[jobName] = handler;
        return Promise.resolve();
      })
    };

    sandbox.stub(populateBatchTransactions, 'publish');

    await init.registerSubscribers(messageQueue);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('the message queue subscribes to the expected jobs', () => {
    test('for getting the charge versions', async () => {
      const { jobName } = populateBatchChargeVersions;
      expect(messageQueue.subscribe.calledWith(jobName)).to.be.true();
    });

    test('for getting the transactions', async () => {
      const { jobName } = populateBatchTransactions;
      expect(messageQueue.subscribe.calledWith(jobName)).to.be.true();
    });
  });

  experiment('when the populateBachChargeVersions job completes', () => {
    experiment('and the job created charge versions', () => {
      test('the populateBatchTransactions job is published', async () => {
        const job = {
          data: {
            request: {
              data: { eventId: 'test-event-id' }
            },
            response: { chargeVersionCount: 10 }
          }
        };

        await onCompleteHandlers[populateBatchChargeVersions.jobName](job);

        expect(populateBatchTransactions.publish.calledWith('test-event-id'))
          .to.be.true();
      });
    });

    experiment('and no charge versions were found', () => {
      test('the populateBatchTransactions job is not published', async () => {
        const job = {
          data: {
            request: {
              data: { eventId: 'test-event-id' }
            },
            response: { chargeVersionCount: 0 }
          }
        };

        await onCompleteHandlers[populateBatchChargeVersions.jobName](job);
        expect(populateBatchTransactions.publish.called).to.be.false();
      });
    });
  });
});
