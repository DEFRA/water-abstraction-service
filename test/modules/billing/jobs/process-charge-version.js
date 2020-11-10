const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const processChargeVersion = require('../../../../src/modules/billing/jobs/process-charge-version');
const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year');
const batchService = require('../../../../src/modules/billing/services/batch-service');

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');

const { Batch, ChargeVersionYear } = require('../../../../src/lib/models');

const eventId = '00000000-0000-0000-0000-000000000000';
const CHARGE_VERSION_YEAR_ID = uuid();
const BATCH_ID = uuid();

experiment('modules/billing/jobs/process-charge-version', () => {
  let chargeVersionYear, batch;

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logHandling');
    sandbox.stub(batchJob, 'logHandlingErrorAndSetBatchStatus');

    chargeVersionYear = new ChargeVersionYear(CHARGE_VERSION_YEAR_ID);
    batch = new Batch(BATCH_ID);

    sandbox.stub(batchService, 'saveInvoicesToDB');
    sandbox.stub(batchService, 'setErrorStatus');

    sandbox.stub(chargeVersionYearService, 'getChargeVersionYearById').resolves(chargeVersionYear);
    sandbox.stub(chargeVersionYearService, 'processChargeVersionYear').resolves(batch);
    sandbox.stub(chargeVersionYearService, 'setErrorStatus').resolves();
    sandbox.stub(chargeVersionYearService, 'setReadyStatus').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(processChargeVersion.jobName).to.equal('billing.process-charge-version.*');
  });

  experiment('.createMessage', () => {
    let message;

    beforeEach(async () => {
      chargeVersionYear = { billing_batch_charge_version_year_id: 1 };
      batch = { id: BATCH_ID };
      message = processChargeVersion.createMessage('test-event-id', chargeVersionYear, batch);
    });

    test('using the expected job name', async () => {
      expect(message.name).to.equal(`billing.process-charge-version.${BATCH_ID}`);
    });

    test('includes a data object with the batch', async () => {
      expect(message.data.batch).to.equal(batch);
    });

    test('includes a data object with the event id', async () => {
      expect(message.data.eventId).to.equal('test-event-id');
    });

    test('includes a data object with the charge version year data', async () => {
      expect(message.data.chargeVersionYear.billing_batch_charge_version_year_id).to.equal(1);
    });
  });

  experiment('.handler', () => {
    let result, job;

    beforeEach(async () => {
      job = {
        data: {
          eventId,
          chargeVersionYear: {
            billingBatchChargeVersionYearId: 'test-id'
          },
          batch: { id: BATCH_ID }
        }
      };

      result = await processChargeVersion.handler(job);
    });

    test('a message is logged', async () => {
      const errorArgs = batchJob.logHandling.lastCall.args;
      expect(errorArgs[0]).to.equal(job);
    });

    test('resolves including the chargeVersionYear', async () => {
      expect(result.chargeVersionYear.id).to.equal(CHARGE_VERSION_YEAR_ID);
    });

    test('resolves including the batch details', async () => {
      expect(result.batch.id).to.equal(BATCH_ID);
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        await processChargeVersion.handler(job);
      });

      test('the charge version year is retrieve by id', async () => {
        expect(chargeVersionYearService.getChargeVersionYearById.calledWith(
          job.data.chargeVersionYear.billingBatchChargeVersionYearId
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
          job.data.chargeVersionYear.billingBatchChargeVersionYearId
        )).to.be.true();
      });
    });

    experiment('when there is an error', () => {
      const err = new Error('oops');
      let error;
      beforeEach(async () => {
        chargeVersionYearService.setReadyStatus.rejects(err);
        const func = () => processChargeVersion.handler(job);
        error = await expect(func()).to.reject();
      });

      test('the billing batch charge version year status is updated to "error"', async () => {
        expect(chargeVersionYearService.setErrorStatus.calledWith(
          job.data.chargeVersionYear.billingBatchChargeVersionYearId
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
});
