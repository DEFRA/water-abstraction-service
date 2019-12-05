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
const event = require('../../../../src/lib/event');
const repos = require('../../../../src/lib/connectors/repository');
const processChargeVersion = require('../../../../src/modules/billing/jobs/process-charge-version');

experiment('modules/billing/jobs/process-charge-version', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(event, 'save').resolves();
    sandbox.stub(event, 'load').resolves({
      event_id: '00000000-0000-0000-0000-000000000000',
      metadata: {
        batch: {
          billing_batch_id: 'test-billing-batch-id'
        }
      }
    });
    sandbox.stub(repos.billingBatchChargeVersionYears, 'setStatus').resolves();
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
    let result;
    beforeEach(async () => {
      result = await processChargeVersion.handler({
        data: {
          eventId: 'test-event-id',
          chargeVersionYear: {
            billing_batch_charge_version_year_id: 'test-id'
          }
        }
      });
    });

    test('resolves including the chargeVersionYear', async () => {
      expect(result.chargeVersionYear.billing_batch_charge_version_year_id).to.equal('test-id');
    });

    test('resolves including the batch details', async () => {
      expect(result.batch.billing_batch_id).to.equal('test-billing-batch-id');
    });
  });
});
