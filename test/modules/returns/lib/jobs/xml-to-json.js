const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test } = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const xmlToJsonJob = require('../../../../../src/modules/returns/lib/jobs/xml-to-json');
const messageQueue = require('../../../../../src/lib/message-queue');
const logger = require('../../../../../src/lib/logger');
const Event = require('../../../../../src/lib/event');
const s3 = require('../../../../../src/lib/connectors/s3');

experiment('publish', () => {
  beforeEach(async () => {
    sandbox.stub(messageQueue, 'publish').resolves('test-job-id');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('publishes a job with the expected name', async () => {
    await xmlToJsonJob.publish('test-event-id');
    const [jobName] = messageQueue.publish.lastCall.args;
    expect(jobName).to.equal(xmlToJsonJob.jobName);
  });

  test('sends the expected job data', async () => {
    await xmlToJsonJob.publish('test-event-id');
    const [, data] = messageQueue.publish.lastCall.args;
    expect(data).to.equal({
      eventId: 'test-event-id',
      subType: 'xml'
    });
  });
});

experiment('handler', () => {
  let job;
  let eventStub;
  beforeEach(async () => {
    eventStub = {
      getId: () => 'test-event-id',
      setStatus: sinon.stub().returnsThis(),
      setComment: sinon.stub().returnsThis(),
      save: sinon.spy()
    };
    sandbox.stub(Event, 'load').resolves(eventStub);

    sandbox.stub(s3, 'getObject').resolves({});
    sandbox.stub(s3, 'upload').resolves({});
    sandbox.spy(logger, 'error');

    job = {
      data: {
        eventId: 'test-event-id'
      },
      done: sinon.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('loads the event', async () => {
    await xmlToJsonJob.handler(job);
    expect(Event.load.calledWith(job.data.eventId)).to.be.true();
  });

  test('loads the S3 object', async () => {
    await xmlToJsonJob.handler(job);
    const [s3Key] = s3.getObject.lastCall.args;
    expect(s3Key).to.equal('returns-upload/test-event-id.xml');
  });

  test('uploads JSON back to S3', async () => {
    await xmlToJsonJob.handler(job);
    const [fileName, buffer] = s3.upload.lastCall.args;
    expect(fileName).to.equal('returns-upload/test-event-id.json');
    expect(buffer).to.be.a.buffer();
  });

  test('updates the event status to validated', async () => {
    await xmlToJsonJob.handler(job);
    expect(eventStub.setStatus.calledWith('validated')).to.be.true();
    expect(eventStub.save.called).to.be.true();
  });

  test('finishes the job', async () => {
    await xmlToJsonJob.handler(job);
    expect(job.done.called).to.be.true();
  });

  experiment('when there is an error', async () => {
    beforeEach(async () => {
      s3.getObject.rejects({ name: 'test-error' });
      await xmlToJsonJob.handler(job);
    });

    test('the error is logged', async () => {
      const [, error] = logger.error.lastCall.args;
      expect(error.params).to.equal({ job });
      expect(error.context.component).not.to.be.undefined();
    });

    test('the status is set to error', async () => {
      const [status] = eventStub.setStatus.lastCall.args;
      expect(status).to.equal('error');
      expect(eventStub.save.called).to.be.true();
    });

    test('the event comment is updated', async () => {
      const [comment] = eventStub.setComment.lastCall.args;
      expect(comment).to.equal('XML to JSON conversion failed');
    });

    test('the job is completed', async () => {
      const [error] = job.done.lastCall.args;
      expect(error.name).to.equal('test-error');
    });
  });
});
