const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { logger } = require('../../../../src/logger');
const refreshTotals = require('../../../../src/modules/billing/jobs/refresh-totals');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const Batch = require('../../../../src/lib/models/batch');

const BATCH_ID = uuid();
const EVENT_ID = uuid();

experiment('modules/billing/jobs/refresh-totals', () => {
  let batch, dbBatchRow;

  beforeEach(async () => {
    dbBatchRow = {
      billing_batch_id: BATCH_ID
    };
    batch = new Batch();
    sandbox.stub(batchService, 'getBatchById');
    sandbox.stub(logger, 'error');
    sandbox.stub(logger, 'info');
    sandbox.stub(batchService, 'refreshTotals');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.jobName', () => {
    test('is set to the expected value', async () => {
      expect(refreshTotals.jobName).to.equal('billing.refreshTotals');
    });
  });

  experiment('.createMessage', () => {
    test('creates an message object of the expected shape for PG boss', async () => {
      const message = refreshTotals.createMessage(EVENT_ID, dbBatchRow);
      expect(message).to.equal({
        name: refreshTotals.jobName,
        data: { eventId: EVENT_ID, batch: dbBatchRow },
        options: {
          singletonKey: BATCH_ID
        }
      });
    });
  });

  experiment('.handler', () => {
    let job;
    beforeEach(async () => {
      job = {
        data: {
          batch: {
            billing_batch_id: BATCH_ID
          }
        }
      };
    });

    experiment('when there are no errors', () => {
      let result;

      beforeEach(async () => {
        result = await refreshTotals.handler(job);
      });

      test('logs an info message', async () => {
        expect(logger.info.called).to.be.true();
      });

      test('gets the batch by ID', async () => {
        expect(batchService.getBatchById.calledWith(BATCH_ID)).to.be.true();
      });

      test('passes the returned batch to the .refreshTotals() method', async () => {
        expect(batchService.refreshTotals.calledWith(batch));
      });

      test('no error is logged', async () => {
        expect(logger.error.called).to.be.false();
      });

      test('the batch is returned', async () => {
        expect(result).to.equal({ batch: job.data.batch });
      });
    });

    experiment('when there are errors', () => {
      beforeEach(async () => {
        batchService.getBatchById.rejects();
        expect(refreshTotals.handler(job)).to.reject();
      });

      test('a message is logged', async () => {
        const [msg, , params] = logger.error.lastCall.args;
        expect(msg).to.be.a.string();
        expect(params).to.equal({ batchId: BATCH_ID });
      });
    });
  });
});
