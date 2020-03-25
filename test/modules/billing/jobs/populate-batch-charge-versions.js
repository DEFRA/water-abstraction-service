'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { logger } = require('../../../../src/logger');
const repos = require('../../../../src/lib/connectors/repository');
const messageQueue = require('../../../../src/lib/message-queue');
const populateBatchChargeVersionsJob = require('../../../../src/modules/billing/jobs/populate-batch-charge-versions');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');

experiment('modules/billing/jobs/populate-batch-charge-versions', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(batchJob, 'logHandling');
    sandbox.stub(messageQueue, 'publish').resolves();
    sandbox.stub(repos.chargeVersions, 'createSupplementaryChargeVersions').resolves([]);
    sandbox.stub(repos.chargeVersions, 'createTwoPartTariffChargeVersions').resolves([]);
    sandbox.stub(repos.chargeVersions, 'createAnnualChargeVersions').resolves([]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(populateBatchChargeVersionsJob.jobName).to.equal('billing.populate-batch-charge-versions.*');
  });

  experiment('.createMessage', () => {
    test('creates the expected request object', async () => {
      const batch = { billing_batch_id: 'test-batch' };
      const message = populateBatchChargeVersionsJob.createMessage('test-event-id', batch);
      expect(message.name).to.equal('billing.populate-batch-charge-versions.test-batch');
      expect(message.data).to.equal({
        eventId: 'test-event-id',
        batch: {
          billing_batch_id: 'test-batch'
        }
      });
    });
  });

  experiment('.handler', () => {
    let job;

    experiment('when the batch is supplementary', () => {
      beforeEach(async () => {
        job = {
          data: {
            eventId: '22222222-2222-2222-2222-222222222222',
            batch: {
              batch_type: 'supplementary',
              billing_batch_id: 'test-batch-id'
            }
          },
          done: sandbox.spy()
        };
      });

      test('the handling of the job is logged', async () => {
        await populateBatchChargeVersionsJob.handler(job);
        expect(batchJob.logHandling.calledWith(job)).to.be.true();
      });

      experiment('if there are charge versions for the batch', () => {
        let result;

        beforeEach(async () => {
          repos.chargeVersions.createSupplementaryChargeVersions.resolves([
            { charge_version_id: 1 }, { charge_version_id: 2 }
          ]);

          result = await populateBatchChargeVersionsJob.handler(job);
        });

        test('the result includes the charge versions', async () => {
          const { chargeVersions } = result;
          expect(chargeVersions).to.equal([
            { charge_version_id: 1 },
            { charge_version_id: 2 }
          ]);
        });

        test('the result includes the batch', async () => {
          const { batch } = result;
          expect(batch.billing_batch_id).to.equal('test-batch-id');
        });
      });

      experiment('if there are no charge versions for the batch', () => {
        let result;

        beforeEach(async () => {
          repos.chargeVersions.createSupplementaryChargeVersions.resolves([]);

          result = await populateBatchChargeVersionsJob.handler(job);
        });

        test('the result includes the charge versions', async () => {
          const { chargeVersions } = result;
          expect(chargeVersions).to.equal([]);
        });

        test('the result includes the batch', async () => {
          const { batch } = result;
          expect(batch.billing_batch_id).to.equal('test-batch-id');
        });
      });
    });

    experiment('when the batch is two part tariff', () => {
      beforeEach(async () => {
        job = {
          data: {
            eventId: '22222222-2222-2222-2222-222222222222',
            batch: {
              batch_type: 'two_part_tariff',
              billing_batch_id: 'test-batch-id'
            }
          },
          done: sandbox.spy()
        };
      });

      experiment('if there are charge versions for the batch', () => {
        let result;

        beforeEach(async () => {
          repos.chargeVersions.createTwoPartTariffChargeVersions.resolves([
            { charge_version_id: 1 }, { charge_version_id: 2 }
          ]);

          result = await populateBatchChargeVersionsJob.handler(job);
        });

        test('the result includes the charge versions', async () => {
          const { chargeVersions } = result;
          expect(chargeVersions).to.equal([
            { charge_version_id: 1 },
            { charge_version_id: 2 }
          ]);
        });

        test('the result includes the batch', async () => {
          const { batch } = result;
          expect(batch.billing_batch_id).to.equal('test-batch-id');
        });
      });

      experiment('if there are no charge versions for the batch', () => {
        let result;

        beforeEach(async () => {
          repos.chargeVersions.createTwoPartTariffChargeVersions.resolves([]);

          result = await populateBatchChargeVersionsJob.handler(job);
        });

        test('the result includes the charge versions', async () => {
          const { chargeVersions } = result;
          expect(chargeVersions).to.equal([]);
        });

        test('the result includes the batch', async () => {
          const { batch } = result;
          expect(batch.billing_batch_id).to.equal('test-batch-id');
        });
      });
    });

    experiment('when the batch is an annual batch', () => {
      beforeEach(async () => {
        job = {
          data: {
            eventId: '22222222-2222-2222-2222-222222222222',
            batch: {
              batch_type: 'annual',
              billing_batch_id: 'test-batch-id'
            }
          },
          done: sandbox.spy()
        };
      });

      experiment('if there are charge versions for the batch', () => {
        let result;

        beforeEach(async () => {
          repos.chargeVersions.createAnnualChargeVersions.resolves([
            { charge_version_id: 1 }, { charge_version_id: 2 }
          ]);

          result = await populateBatchChargeVersionsJob.handler(job);
        });

        test('the result includes the charge versions', async () => {
          const { chargeVersions } = result;
          expect(chargeVersions).to.equal([
            { charge_version_id: 1 },
            { charge_version_id: 2 }
          ]);
        });

        test('the result includes the batch', async () => {
          const { batch } = result;
          expect(batch.billing_batch_id).to.equal('test-batch-id');
        });
      });

      experiment('if there are no charge versions for the batch', () => {
        let result;

        beforeEach(async () => {
          repos.chargeVersions.createAnnualChargeVersions.resolves([]);
          result = await populateBatchChargeVersionsJob.handler(job);
        });

        test('the result includes the charge versions', async () => {
          const { chargeVersions } = result;
          expect(chargeVersions).to.equal([]);
        });

        test('the result includes the batch', async () => {
          const { batch } = result;
          expect(batch.billing_batch_id).to.equal('test-batch-id');
        });
      });
    });
  });
});
