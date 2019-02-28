const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test } = exports.lab = require('lab').script();

const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const xmlToJsonJob = require('../../../../../src/modules/returns/lib/jobs/xml-to-json');
const xmlToJsonMapping = require('../../../../../src/modules/returns/lib/xml-to-json-mapping');
const messageQueue = require('../../../../../src/lib/message-queue');
const { logger } = require('@envage/water-abstraction-helpers');
const event = require('../../../../../src/lib/event');
const s3 = require('../../../../../src/lib/connectors/s3');
const { usersClient } = require('../../../../../src/lib/connectors/idm');

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

  beforeEach(async () => {
    sandbox.stub(event, 'load').resolves({
      eventId: 'test-event-id',
      issuer: 'test-job@example.com'
    });
    sandbox.stub(event, 'save').resolves();

    const str = fs.readFileSync(path.join(__dirname, '../xml-files-for-tests/weekly-return-pass.xml'));

    sandbox.stub(usersClient, 'getUserByUserName').resolves({
      user_id: 123,
      user_name: 'test-job@example.com',
      external_id: '1234-abcd'
    });
    sandbox.stub(xmlToJsonMapping, 'mapXml').resolves('{}');

    sandbox.stub(s3, 'getObject').resolves({ Body: Buffer.from(str, 'utf-8') });
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
    expect(event.load.calledWith(job.data.eventId)).to.be.true();
  });

  test('loads the S3 object', async () => {
    await xmlToJsonJob.handler(job);
    const [s3Key] = s3.getObject.lastCall.args;
    expect(s3Key).to.equal('returns-upload/test-event-id.xml');
  });

  test('gets the user object for the issuer', async () => {
    await xmlToJsonJob.handler(job);
    const [userName] = usersClient.getUserByUserName.lastCall.args;
    expect(userName).to.equal('test-job@example.com');
  });

  test('maps the JSON to the required shape', async () => {
    await xmlToJsonJob.handler(job);
    const [, user] = xmlToJsonMapping.mapXml.lastCall.args;
    expect(user.user_id).to.equal(123);
  });

  test('uploads JSON back to S3', async () => {
    await xmlToJsonJob.handler(job);
    const [fileName, buffer] = s3.upload.lastCall.args;
    expect(fileName).to.equal('returns-upload/test-event-id.json');
    expect(buffer).to.be.a.buffer();
  });

  test('updates the event status to validated', async () => {
    await xmlToJsonJob.handler(job);
    const [evt] = event.save.lastCall.args;
    expect(evt.status).to.equal('validated');
  });

  test('finishes the job', async () => {
    await xmlToJsonJob.handler(job);
    expect(job.done.called).to.be.true();
  });

  experiment('when the user is not found', async () => {
    beforeEach(async () => {
      usersClient.getUserByUserName.resolves();
      await xmlToJsonJob.handler(job);
    });

    test('the error is logged', async () => {
      const params = logger.error.lastCall.args[2];
      expect(params.job).to.equal(job);
    });

    test('the status is set to error', async () => {
      const [evt] = event.save.lastCall.args;
      expect(evt.status).to.equal('error');
    });

    test('the event metadata is updated', async () => {
      const [evt] = event.save.lastCall.args;
      expect(evt.metadata.error.key).to.equal('user-not-found');
    });

    test('the job is completed', async () => {
      const [error] = job.done.lastCall.args;
      expect(error).to.exist();
    });
  });

  experiment('when the XML cannot be mapped to JSON', async () => {
    beforeEach(async () => {
      xmlToJsonMapping.mapXml.throws();
      await xmlToJsonJob.handler(job);
    });

    test('the error is logged', async () => {
      const params = logger.error.lastCall.args[2];
      expect(params.job).to.equal(job);
    });

    test('the status is set to error', async () => {
      const [evt] = event.save.lastCall.args;
      expect(evt.status).to.equal('error');
    });

    test('the event metadata is updated', async () => {
      const [evt] = event.save.lastCall.args;
      expect(evt.metadata.error.key).to.equal('xml-to-json-mapping-failure');
    });

    test('the job is completed', async () => {
      const [error] = job.done.lastCall.args;
      expect(error).to.exist();
    });
  });

  experiment('when there is an error', async () => {
    beforeEach(async () => {
      s3.getObject.rejects({ name: 'test-error' });
      await xmlToJsonJob.handler(job);
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
      expect(evt.metadata.error.key).to.equal('server');
    });

    test('the job is completed', async () => {
      const [error] = job.done.lastCall.args;
      expect(error.name).to.equal('test-error');
    });
  });
});
