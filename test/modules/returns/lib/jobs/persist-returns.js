const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const persistReturnsJob = require('../../../../../src/modules/returns/lib/jobs/persist-returns');
const returnsUpload = require('../../../../../src/modules/returns/lib/returns-upload');
const messageQueue = require('../../../../../src/lib/message-queue');
const { logger } = require('../../../../../src/logger');
const event = require('../../../../../src/lib/event');
const returnsConnector = require('../../../../../src/modules/returns/lib/api-connector');

experiment('publish', () => {
  beforeEach(async () => {
    sandbox.stub(messageQueue, 'publish').resolves('test-job-id');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('publishes a job with the expected name', async () => {
    await persistReturnsJob.publish('test-event-id');
    const [jobName] = messageQueue.publish.lastCall.args;
    expect(jobName).to.equal(persistReturnsJob.jobName);
  });

  test('sends the expected job data', async () => {
    await persistReturnsJob.publish('test-event-id');
    const [, data] = messageQueue.publish.lastCall.args;
    expect(data).to.equal({
      eventId: 'test-event-id',
      subType: 'xml'
    });
  });
});

experiment('handler', () => {
  let job;
  let testError;

  beforeEach(async () => {
    sandbox.stub(event, 'load').resolves({
      metadata: {
        returns: [
          { returnId: 'test-return-1', submitted: false, error: null },
          { returnId: 'test-return-2', submitted: false, error: null }
        ]
      }
    });
    sandbox.stub(event, 'save').resolves();

    sandbox.stub(returnsUpload, 'getReturnsS3Object').resolves({
      Body: Buffer.from(JSON.stringify([
        { returnId: 'test-return-1', returnRequirement: '11111111' },
        { returnId: 'test-return-2', returnRequirement: '22222222' }
      ]), 'utf-8')
    });

    testError = new Error('test-error');

    sandbox.stub(returnsConnector, 'persistReturnData')
      .onFirstCall().resolves({
        return: true,
        version: true,
        lines: true
      })
      .onSecondCall().rejects(testError);

    sandbox.stub(logger, 'error');

    job = {
      data: { eventId: 'test-event-id', key: 'test-s3-key' },
      done: sinon.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('loads the event', async () => {
    await persistReturnsJob.handler(job);
    expect(event.load.calledWith(job.data.eventId)).to.be.true();
  });

  test('loads the S3 object', async () => {
    await persistReturnsJob.handler(job);
    const [eventId, type] = returnsUpload.getReturnsS3Object.lastCall.args;
    expect(eventId).to.equal('test-event-id');
    expect(type).to.equal('json');
  });

  test('attempts to save both returns', async () => {
    await persistReturnsJob.handler(job);

    const firstReturn = returnsConnector.persistReturnData.firstCall.args[0];
    const secondReturn = returnsConnector.persistReturnData.secondCall.args[0];

    expect(firstReturn.returnId).to.equal('test-return-1');
    expect(secondReturn.returnId).to.equal('test-return-2');
  });

  test('updates the event metadata with the upload result', async () => {
    await persistReturnsJob.handler(job);
    const [evt] = event.save.lastCall.args;
    expect(evt.metadata).to.equal({
      returns: [
        { returnId: 'test-return-1', submitted: true, error: null },
        { returnId: 'test-return-2', submitted: false, error: testError }
      ]
    });
  });

  test('sets the event status to submitted on completion', async () => {
    await persistReturnsJob.handler(job);
    const [evt] = event.save.lastCall.args;
    expect(evt.status).to.equal(returnsUpload.uploadStatus.SUBMITTED);
  });

  test('finishes the job', async () => {
    await persistReturnsJob.handler(job);
    expect(job.done.called).to.be.true();
  });

  experiment('when there is an error', async () => {
    beforeEach(async () => {
      returnsUpload.getReturnsS3Object.rejects(testError);
      await persistReturnsJob.handler(job);
    });

    test('the error is logged', async () => {
      const [message, error, params] = logger.error.lastCall.args;
      expect(message).to.be.a.string();
      expect(error).to.equal(testError);
      expect(params.job).to.equal(job);
    });

    test('the status is set to error', async () => {
      const [evt] = event.save.lastCall.args;
      expect(evt.status).to.equal('error');
    });

    test('the job is completed', async () => {
      const [error] = job.done.lastCall.args;
      expect(error.message).to.equal('test-error');
    });
  });
});
