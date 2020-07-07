'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const { logger } = require('../../../../../src/logger');
const jobConfig = require('../../../../../src/modules/billing/bull-jobs/create-bill-run/config');
const populateBatchChargeVersions = require('../../../../../src/modules/billing/bull-jobs/populate-batch-charge-versions');
const sandbox = require('sinon').createSandbox();

experiment('modules/billing/bull-jobs/create-bill-run/config.js', () => {
  let batch, result, eventId;

  beforeEach(async () => {
    batch = {
      id: uuid()
    };

    eventId = uuid();

    sandbox.stub(logger, 'info');
    sandbox.stub(populateBatchChargeVersions, 'publish');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('has the correct queue name', () => {
    expect(jobConfig.jobName).to.equal('billing.create-bill-run.*');
  });

  experiment('.createMessage', () => {
    beforeEach(async () => {
      result = jobConfig.createMessage(batch, eventId);
    });

    test('formats the message', async () => {
      expect(result.data.batch).to.equal(batch);
      expect(result.data.eventId).to.equal(eventId);
      expect(result.options.jobId).to.equal(`billing.create-bill-run.${batch.id}`);
    });
  });

  experiment('.onComplete', () => {
    let job;

    beforeEach(async () => {
      job = {
        data: {
          batch: {
            id: uuid()
          }
        },
        id: `billing.create-bill-run.${uuid()}`
      };
      await jobConfig.onComplete(job);
    });

    test('logs a message', async () => {
      expect(logger.info.calledWith(
        `Handling onComplete: ${job.id}`
      )).to.be.true();
    });

    test('publishes a job to populate the batch charge versions', async () => {
      expect(populateBatchChargeVersions.publish.calledWith(job.data)).to.be.true();
    });
  });
});
