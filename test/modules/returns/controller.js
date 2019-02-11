const { expect } = require('code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('../../../src/modules/returns/controller');
const Event = require('../../../src/lib/event');
const messageQueue = require('../../../src/lib/message-queue');
const s3 = require('../../../src/lib/connectors/s3');

experiment('getUploadXml', () => {
  beforeEach(async () => {
    sandbox.stub(Event, 'load').resolves({ rowCount: 1, rows: [{ test: 'test' }] });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the event id to Event.load', async () => {
    const request = {
      params: {
        eventId: 'test-id'
      }
    };
    await controller.getUploadXml(request);
    const [eventId] = Event.load.lastCall.args;
    expect(eventId).to.equal('test-id');
  });

  test('returns the expected response', async () => {
    const request = {
      params: {
        eventId: 'test-id'
      }
    };
    const response = await controller.getUploadXml(request);
    expect(response).to.equal({
      data: { test: 'test' },
      error: null
    });
  });

  test('returns 404 for not existent event id', async () => {
    Event.load.resolves({
      rowCount: 0,
      rows: []
    });

    const request = { params: { eventId: 'test-id' } };
    const response = await controller.getUploadXml(request);

    expect(response.output.statusCode).to.equal(404);
    expect(response.output.payload.message).to.equal('No event found');
  });
});

experiment('postUploadXml', () => {
  let request;
  let h;

  beforeEach(async () => {
    sandbox.stub(Event.prototype, 'save').resolves({});
    sandbox.stub(Event.prototype, 'getId').returns('test-event-id');
    sandbox.stub(s3, 'upload').resolves({ Location: 'test-s3-location' });
    sandbox.stub(messageQueue, 'publish').resolves('test-job-id');

    request = {
      payload: {
        userName: 'test-user',
        fileData: '10101'
      }
    };

    h = {
      response: sinon.stub().returns({
        code: sinon.spy()
      })
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('an event is saved with the expected values', async () => {
    await controller.postUploadXml(request, h);
    const [eventValues] = Event.prototype.save.thisValues;
    expect(eventValues.data.type).to.equal('returns-upload');
    expect(eventValues.data.subtype).to.equal('xml');
    expect(eventValues.data.issuer).to.equal('test-user');
    expect(eventValues.data.status).to.equal('processing');
  });

  test('file data is uploaded to S3', async () => {
    await controller.postUploadXml(request, h);
    const [filename, fileData] = s3.upload.lastCall.args;

    expect(filename).to.equal('returns-upload/test-event-id.xml');
    expect(fileData).to.equal('10101');
  });

  test('creates a new job for the task queue', async () => {
    await controller.postUploadXml(request, h);
    const [jobName, message] = messageQueue.publish.lastCall.args;

    expect(jobName).to.equal('returns-upload');
    expect(message.eventId).to.equal('test-event-id');
    expect(message.location).to.equal('test-s3-location');
    expect(message.subType).to.equal('xml');
  });

  test('response contains the expected data', async () => {
    await controller.postUploadXml(request, h);
    const [responseData] = h.response.lastCall.args;

    expect(responseData.data.eventId).to.equal('test-event-id');
    expect(responseData.data.filename).to.equal('returns-upload/test-event-id.xml');
    expect(responseData.data.location).to.equal('test-s3-location');
    expect(responseData.data.jobId).to.equal('test-job-id');
    expect(responseData.data.statusLink).to.equal('/water/1.0/returns/upload-xml/test-event-id');
  });
});
