const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test } = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const startUploadJob = require('../../../../../src/modules/returns/lib/jobs/start-xml-upload');
const returnsUpload = require('../../../../../src/modules/returns/lib/returns-upload');
const messageQueue = require('../../../../../src/lib/message-queue');
const { logger } = require('@envage/water-abstraction-helpers');
const event = require('../../../../../src/lib/event');

experiment('publish', () => {
  beforeEach(async () => {
    sandbox.stub(messageQueue, 'publish').resolves('test-job-id');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('publishes a job with the expected name', async () => {
    await startUploadJob.publish('test-event-id');
    const [jobName] = messageQueue.publish.lastCall.args;
    expect(jobName).to.equal(startUploadJob.jobName);
  });

  test('sends the expected job data', async () => {
    await startUploadJob.publish('test-event-id');
    const [, data] = messageQueue.publish.lastCall.args;
    expect(data).to.equal({
      eventId: 'test-event-id',
      subType: 'xml'
    });
  });
});

experiment('handler', () => {
  let job;

  beforeEach(async () => {
    sandbox.stub(event, 'load').resolves({
      eventId: 'test-event-id'
    });
    sandbox.stub(event, 'save').resolves();
    sandbox.stub(returnsUpload, 'getReturnsS3Object').resolves({});
    sandbox.spy(logger, 'error');

    job = {
      data: {
        eventId: 'test-event-id',
        key: 'test-s3-key'
      },
      done: sinon.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('loads the event', async () => {
    await startUploadJob.handler(job);
    expect(event.load.calledWith(job.data.eventId)).to.be.true();
  });

  test('loads the S3 object', async () => {
    await startUploadJob.handler(job);
    const [eventId] = returnsUpload.getReturnsS3Object.lastCall.args;
    expect(eventId).to.equal('test-event-id');
  });

  test('finishes the job', async () => {
    await startUploadJob.handler(job);
    expect(job.done.called).to.be.true();
  });

  experiment('when there is an error', async () => {
    beforeEach(async () => {
      returnsUpload.getReturnsS3Object.rejects({ name: 'test-error' });
      await startUploadJob.handler(job);
    });

    test('the error is logged', async () => {
      const params = logger.error.lastCall.args[2];
      expect(params.job).to.equal(job);
    });

    test('the status is set to error', async () => {
      const [evt] = event.save.lastCall.args;
      expect(evt.status).to.equal('error');
    });

    test('the event comment is updated', async () => {
      const [evt] = event.save.lastCall.args;
      expect(evt.comment).to.equal('Validation Failed');
    });

    test('the job is completed', async () => {
      const [error] = job.done.lastCall.args;
      expect(error.name).to.equal('test-error');
    });
  });
});
