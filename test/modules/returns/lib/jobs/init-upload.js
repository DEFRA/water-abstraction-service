const { expect } = require('@hapi/code');
const { beforeEach, afterEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const startUploadJob = require('../../../../../src/modules/returns/lib/jobs/start-upload');
const mapToJsonJob = require('../../../../../src/modules/returns/lib/jobs/map-to-json');
const validateReturnsJob = require('../../../../../src/modules/returns/lib/jobs/validate-returns');
const persistReturnsJob = require('../../../../../src/modules/returns/lib/jobs/persist-returns');
const { registerSubscribers } = require('../../../../../src/modules/returns/lib/jobs/init-upload');

const eventId = 'test-event-id';
const companyId = 'test-company-id';

// This is the shape of the data passed to the onComplete handler.
const job = {
  data: {
    request: {
      data: {
        eventId,
        companyId
      }
    }
  }
};
experiment('/modules/returns/lib/jobs/init-upload .registerSubscribers', () => {
  let messageQueue;

  beforeEach(async () => {
    sandbox.stub(mapToJsonJob, 'publish').resolves({});
    sandbox.stub(validateReturnsJob, 'publish').resolves({});
    messageQueue = {
      subscribe: sandbox.spy(),
      onComplete: sandbox.spy(),
      stop: sandbox.stub()
    };
    await registerSubscribers(messageQueue);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('subscribes to the start upload job', async () => {
    const { jobName, handler } = startUploadJob;
    expect(messageQueue.subscribe.calledWith(jobName, handler)).to.be.true();
  });

  test('subscribes to the map to JSON job', async () => {
    const { jobName, handler } = mapToJsonJob;
    expect(messageQueue.subscribe.calledWith(jobName, handler)).to.be.true();
  });

  test('if the start job fails, the process is stopped', async () => {
    const [, handler] = messageQueue.onComplete.args.find(call => call[0] === startUploadJob.jobName);

    await handler({ data: { ...job.data, failed: true } });
    expect(messageQueue.stop.calledOnce).to.be.true();
  });

  test('when the start job finishes, the map to JSON job is published', async () => {
    // Find the handler passed to onComplete when the job name was
    // the start upload job name.
    const [, handler] = messageQueue.onComplete.args.find(call => call[0] === startUploadJob.jobName);

    await handler(job);
    const expectedJobData = { eventId, companyId };
    expect(mapToJsonJob.publish.calledWith(expectedJobData)).to.be.true();
  });

  test('subscribes to the validate returns job', async () => {
    const { jobName, handler } = validateReturnsJob;
    expect(messageQueue.subscribe.calledWith(jobName, handler)).to.be.true();
  });

  test('when the map to json job finishes, the validate returns job is published', async () => {
    // Find the handler passed to onComplete when the job name was
    // the start upload job name.
    const [, handler] = messageQueue.onComplete.args.find(call => call[0] === mapToJsonJob.jobName);

    await handler(job);
    const expectedJobData = { eventId, companyId };
    expect(validateReturnsJob.publish.calledWith(expectedJobData)).to.be.true();
  });

  test('subscribes to the persist returns job', async () => {
    const { jobName, handler } = persistReturnsJob;
    expect(messageQueue.subscribe.calledWith(jobName, handler)).to.be.true();
  });
});
