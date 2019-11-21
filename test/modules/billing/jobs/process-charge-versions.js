const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const event = require('../../../../src/lib/event');
const processChargeVersions = require('../../../../src/modules/billing/jobs/process-charge-versions');

experiment('modules/billing/jobs/process-charge-versions', () => {
  beforeEach(async () => {
    sandbox.stub(event, 'save').resolves();
    sandbox.stub(event, 'load').resolves({
      event_id: '00000000-0000-0000-0000-000000000000'
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(processChargeVersions.jobName).to.equal('billing.process-charge-version');
  });

  experiment('.createMessage', () => {
    let message;

    beforeEach(async () => {
      message = processChargeVersions.createMessage('test-event-id', {
        billing_batch_charge_version_year_id: 1
      });
    });

    test('using the expected job name', async () => {
      expect(message.name).to.equal(processChargeVersions.jobName);
    });

    test('includes a data object with the event id', async () => {
      expect(message.data.eventId).to.equal('test-event-id');
    });

    test('includes a data object with the charge version year data', async () => {
      expect(message.data.chargeVersionYear.billing_batch_charge_version_year_id).to.equal(1);
    });
  });
});
