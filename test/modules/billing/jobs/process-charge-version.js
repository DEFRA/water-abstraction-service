const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { logger } = require('../../../../src/logger');
const event = require('../../../../src/lib/event');
const processChargeVersion = require('../../../../src/modules/billing/jobs/process-charge-version');

const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year');

const service = require('../../../../src/modules/billing/service');
const { Batch } = require('../../../../src/lib/models');

const eventId = '00000000-0000-0000-0000-000000000000';

experiment('modules/billing/jobs/process-charge-version', () => {
  let batch;

  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(event, 'save').resolves();
    sandbox.stub(event, 'load').resolves({
      event_id: eventId,
      metadata: {
        batch: {
          billing_batch_id: 'test-billing-batch-id'
        }
      }
    });

    sandbox.stub(logger, 'error');

    batch = new Batch();
    sandbox.stub(service.chargeVersionYear, 'createBatchFromChargeVersionYear').resolves(batch);
    sandbox.stub(service.chargeVersionYear, 'persistChargeVersionYearBatch');
    // sandbox.stub(repository.billingBatchChargeVersionYears, 'setStatus');

    sandbox.stub(chargeVersionYearService, 'setErrorStatus').resolves();
    sandbox.stub(chargeVersionYearService, 'setReadyStatus').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(processChargeVersion.jobName).to.equal('billing.process-charge-version');
  });

  experiment('.createMessage', () => {
    let message;

    beforeEach(async () => {
      message = processChargeVersion.createMessage('test-event-id', {
        billing_batch_charge_version_year_id: 1
      });
    });

    test('using the expected job name', async () => {
      expect(message.name).to.equal(processChargeVersion.jobName);
    });

    test('includes a data object with the event id', async () => {
      expect(message.data.eventId).to.equal('test-event-id');
    });

    test('includes a data object with the charge version year data', async () => {
      expect(message.data.chargeVersionYear.billing_batch_charge_version_year_id).to.equal(1);
    });
  });

  experiment('.handler', () => {
    let result, job, chargeVersionYear;

    beforeEach(async () => {
      chargeVersionYear = {
        billing_batch_charge_version_year_id: 'test-id',
        charge_version_id: 'charge_verion_id',
        financial_year_ending: 2020,
        billing_batch_id: 'billing_batch_id'
      };

      job = {
        data: {
          eventId,
          chargeVersionYear
        }
      };

      result = await processChargeVersion.handler(job);
    });

    test('resolves including the chargeVersionYear', async () => {
      expect(result.chargeVersionYear.billing_batch_charge_version_year_id).to.equal('test-id');
    });

    test('resolves including the batch details', async () => {
      expect(result.batch.billing_batch_id).to.equal('test-billing-batch-id');
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        await processChargeVersion.handler(job);
      });

      test('a batch model is created from the charge version year', async () => {
        expect(service.chargeVersionYear.createBatchFromChargeVersionYear.calledWith(
          chargeVersionYear
        )).to.be.true();
      });

      test('the batch model is persisted', async () => {
        expect(service.chargeVersionYear.persistChargeVersionYearBatch.calledWith(
          batch
        )).to.be.true();
      });

      test('the billing batch charge version year status is updated to "ready"', async () => {
        expect(chargeVersionYearService.setReadyStatus.calledWith(
          chargeVersionYear.billing_batch_charge_version_year_id
        )).to.be.true();
      });
    });

    experiment('when there is an error', () => {
      beforeEach(async () => {
        chargeVersionYearService.setReadyStatus.rejects();
        try {
          await processChargeVersion.handler(job);
          fail();
        } catch (err) {

        }
      });

      test('a message is logged', async () => {
        const [msg, err, data] = logger.error.lastCall.args;
        expect(msg).to.equal('Error processing charge version year');
        expect(err).to.be.an.error();
        expect(data).to.equal({
          eventId,
          chargeVersionYear
        });
      });

      test('the billing batch charge version year status is updated to "error"', async () => {
        expect(chargeVersionYearService.setErrorStatus.calledWith(
          chargeVersionYear.billing_batch_charge_version_year_id
        )).to.be.true();
      });
    });
  });
});
