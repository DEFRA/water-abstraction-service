const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const processChargeVersionYear = require('../../../../src/modules/billing/jobs/process-charge-version-year');
const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year');
const batchService = require('../../../../src/modules/billing/services/batch-service');

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');

const { Batch, ChargeVersionYear } = require('../../../../src/lib/models');

const CHARGE_VERSION_YEAR_ID = uuid();
const BATCH_ID = uuid();

experiment('modules/billing/jobs/process-charge-version', () => {
  let chargeVersionYear, batch, queueManager;

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logHandling');
    sandbox.stub(batchJob, 'logHandlingErrorAndSetBatchStatus');
    sandbox.stub(batchJob, 'logOnCompleteError');

    chargeVersionYear = new ChargeVersionYear(CHARGE_VERSION_YEAR_ID);
    batch = new Batch(BATCH_ID);

    sandbox.stub(batchService, 'saveInvoicesToDB');
    sandbox.stub(batchService, 'setErrorStatus');

    sandbox.stub(chargeVersionYearService, 'getChargeVersionYearById').resolves(chargeVersionYear);
    sandbox.stub(chargeVersionYearService, 'processChargeVersionYear').resolves(batch);
    sandbox.stub(chargeVersionYearService, 'setErrorStatus').resolves();
    sandbox.stub(chargeVersionYearService, 'setReadyStatus').resolves();
    sandbox.stub(chargeVersionYearService, 'getStatusCounts').resolves({
      processing: 3
    });

    queueManager = {
      add: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(processChargeVersionYear.jobName).to.equal('billing.process-charge-version-year');
  });

  experiment('.createMessage', () => {
    let message;

    beforeEach(async () => {
      message = processChargeVersionYear.createMessage(BATCH_ID, CHARGE_VERSION_YEAR_ID);
    });

    test('creates the expected message array', async () => {
      expect(message).to.equal([
        'billing.process-charge-version-year',
        {
          batchId: BATCH_ID,
          billingBatchChargeVersionYearId: CHARGE_VERSION_YEAR_ID
        },
        {
          jobId: `billing.process-charge-version-year.${BATCH_ID}.${CHARGE_VERSION_YEAR_ID}`
        }
      ]);
    });
  });

  experiment('.handler', () => {
    let result, job;

    beforeEach(async () => {
      job = {
        data: {
          batchId: BATCH_ID,
          billingBatchChargeVersionYearId: CHARGE_VERSION_YEAR_ID
        }
      };

      result = await processChargeVersionYear.handler(job);
    });

    test('a message is logged', async () => {
      const errorArgs = batchJob.logHandling.lastCall.args;
      expect(errorArgs[0]).to.equal(job);
    });

    test('resolves including the number of processing records remaining', async () => {
      expect(result.processing).to.equal(3);
    });

    test('resolves including the batch details', async () => {
      expect(result.batch.id).to.equal(BATCH_ID);
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        await processChargeVersionYear.handler(job);
      });

      test('the charge version year is retrieve by id', async () => {
        expect(chargeVersionYearService.getChargeVersionYearById.calledWith(
          job.data.billingBatchChargeVersionYearId
        )).to.be.true();
      });

      test('a batch model is created from the charge version year', async () => {
        expect(chargeVersionYearService.processChargeVersionYear.calledWith(
          chargeVersionYear
        )).to.be.true();
      });

      test('the batch model is persisted', async () => {
        expect(batchService.saveInvoicesToDB.calledWith(
          batch
        )).to.be.true();
      });

      test('the billing batch charge version year status is updated to "ready"', async () => {
        expect(chargeVersionYearService.setReadyStatus.calledWith(
          job.data.billingBatchChargeVersionYearId
        )).to.be.true();
      });
    });

    experiment('when there is an error', () => {
      const err = new Error('oops');
      let error;
      beforeEach(async () => {
        chargeVersionYearService.setReadyStatus.rejects(err);
        const func = () => processChargeVersionYear.handler(job);
        error = await expect(func()).to.reject();
      });

      test('the billing batch charge version year status is updated to "error"', async () => {
        expect(chargeVersionYearService.setErrorStatus.calledWith(
          job.data.billingBatchChargeVersionYearId
        )).to.be.true();
      });

      test('the error is logged and batch marked as error status', async () => {
        const { args } = batchJob.logHandlingErrorAndSetBatchStatus.lastCall;
        expect(args[0]).to.equal(job);
        expect(args[1] instanceof Error).to.be.true();
        expect(args[2]).to.equal(Batch.BATCH_ERROR_CODE.failedToProcessChargeVersions);
      });

      test('re-throws the error', async () => {
        expect(error).to.equal(err);
      });
    });
  });

  experiment('onComplete', () => {
    let job;

    experiment('when there are still charge version years to process', () => {
      beforeEach(async () => {
        job = {
          returnvalue: {
            batch: {
              status: Batch.BATCH_STATUS.processing
            },
            processing: 4
          }
        };
        await processChargeVersionYear.onComplete(job, queueManager);
      });

      test('no further jobs are scheduled', async () => {
        expect(queueManager.add.called).to.be.false();
      });
    });

    experiment('when the batch is empty', () => {
      beforeEach(async () => {
        job = {
          returnvalue: {
            batch: {
              status: Batch.BATCH_STATUS.empty
            },
            processing: 0
          }
        };
        await processChargeVersionYear.onComplete(job, queueManager);
      });

      test('no further jobs are scheduled', async () => {
        expect(queueManager.add.called).to.be.false();
      });
    });

    experiment('when there all charge version years are processed', () => {
      beforeEach(async () => {
        job = {
          returnvalue: {
            batch: {
              id: BATCH_ID,
              status: Batch.BATCH_STATUS.processing
            },
            processing: 0
          }
        };
        await processChargeVersionYear.onComplete(job, queueManager);
      });

      test('the prepare transactions job is scheduled', async () => {
        expect(queueManager.add.callCount).to.equal(1);
        expect(queueManager.add.calledWith(
          'billing.prepare-transactions', BATCH_ID
        )).to.be.true();
      });
    });

    experiment('when there is an error', () => {
      let err;

      beforeEach(async () => {
        err = new Error('oops');
        queueManager.add.rejects(err);
        await processChargeVersionYear.onComplete(job, queueManager);
      });

      test('a message is logged', async () => {
        expect(batchJob.logOnCompleteError.calledWith(job, err)).to.be.true();
      });
    });
  });
});
