'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const createBillRunJob = require('../../../../src/modules/billing/jobs/create-bill-run');

// Services
const batchService = require('../../../../src/modules/billing/services/batch-service');

// Models
const Batch = require('../../../../src/lib/models/batch');

const batchId = uuid();

const data = {
  eventId: 'test-event-id',
  batch: {
    id: batchId
  }
};

experiment('modules/billing/jobs/create-bill-run', () => {
  let batch;

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logHandling');
    sandbox.stub(batchJob, 'logHandlingError');

    batch = new Batch();
    batch.fromHash(data.batch);

    sandbox.stub(batchService, 'createChargeModuleBillRun').resolves(batch);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(createBillRunJob.jobName).to.equal('billing.create-bill-run.*');
  });

  experiment('.createMessage', () => {
    test('creates the expected message object', async () => {
      const message = createBillRunJob.createMessage(
        data.eventId,
        data.batch
      );

      expect(message).to.equal({
        name: `billing.create-bill-run.${batchId}`,
        data: {
          eventId: data.eventId,
          batch: data.batch
        },
        options: {
          singletonKey: batchId
        }
      });
    });
  });

  experiment('.handler', () => {
    let result, job;

    experiment('when there is no error', async () => {
      beforeEach(async () => {
        job = {
          data: {
            batch: data.batch,
            eventId: data.eventId
          }
        };
        result = await createBillRunJob.handler(job);
      });

      test('batchService.createChargeModuleBillRun is called with the correct batch ID', async () => {
        expect(batchService.createChargeModuleBillRun.calledWith(
          batchId
        )).to.be.true();
      });

      test('resolves with eventId and updated batch', async () => {
        expect(result.eventId).to.equal(data.eventId);
        expect(result.batch instanceof Batch).to.be.true();
      });
    });

    experiment('when there is an error', async () => {
      beforeEach(async () => {
        job = {
          data: {
            batch: data.batch,
            eventId: data.eventId
          }
        };
        batchService.createChargeModuleBillRun.rejects();
      });

      test('the error is logged and rethrown', async () => {
        const func = () => createBillRunJob.handler(job);
        await expect(func()).to.reject();
        const { args } = batchJob.logHandlingError.lastCall;
        expect(args[0]).to.equal(job);
        expect(args[1] instanceof Error).to.be.true();
      });
    });
  });
});
