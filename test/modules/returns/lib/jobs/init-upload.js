const { expect } = require('@hapi/code');
const { beforeEach, afterEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const startUploadJob = require('../../../../../src/modules/returns/lib/jobs/start-upload');
const mapToJsonJob = require('../../../../../src/modules/returns/lib/jobs/map-to-json');
const validateReturnsJob = require('../../../../../src/modules/returns/lib/jobs/validate-returns');
const persistReturnsJob = require('../../../../../src/modules/returns/lib/jobs/persist-returns');
const { registerSubscribers } = require('../../../../../src/modules/returns/lib/jobs/init-upload');
const eventsService = require('../../../../../src/lib/services/events');
const { logger } = require('../../../../../src/logger');
const errorEvent = require('../../../../../src/modules/returns/lib/jobs/error-event');

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
      onComplete: sandbox.spy()
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

  experiment('if the start job fails', async () => {
    beforeEach(async () => {
      sandbox.stub(eventsService, 'findOne').resolves({ eventId });
      sandbox.stub(logger, 'error').resolves({});
      sandbox.stub(errorEvent, 'throwEventNotFoundError').returns();
      sandbox.stub(errorEvent, 'setEventError').resolves({});
    });

    test('finds the event', async () => {
      const [, handler] = messageQueue.onComplete.args.find(call => call[0] === startUploadJob.jobName);
      await handler({ data: { ...job.data, failed: true } });
      expect(eventsService.findOne.calledWith(eventId)).to.be.true();
    });

    test('throws error if event is not found', async () => {
      eventsService.findOne.resolves({});
      const [, handler] = messageQueue.onComplete.args.find(call => call[0] === startUploadJob.jobName);

      try {
        await handler({ data: { ...job.data, failed: true } });
      } catch (err) {
        expect(err.message).to.equal(`Bulk upload event "${eventId}" not found`);
      }
    });

    test('log the error', async () => {
      const [, handler] = messageQueue.onComplete.args.find(call => call[0] === startUploadJob.jobName);

      await handler({ data: { ...job.data, failed: true } });
      const [message, error, { data }] = logger.error.lastCall.args;
      expect(message).to.equal('Returns upload failure');
      expect(error.message).to.equal('returns-upload-to-json job failed');
      expect(data.failed).to.be.true();
      expect(data.request.data).to.equal({ eventId, companyId });
    });

    test('set the event to error', async () => {
      const [, handler] = messageQueue.onComplete.args.find(call => call[0] === startUploadJob.jobName);

      await handler({ data: { ...job.data, failed: true } });
      const [event, error] = errorEvent.setEventError.lastCall.args;
      expect(event).to.equal({ eventId });
      expect(error.message).to.equal('returns-upload-to-json job failed');
    });
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
