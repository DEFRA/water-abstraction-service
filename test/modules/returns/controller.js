const Boom = require('boom');
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
const s3 = require('../../../src/lib/connectors/s3');
const startUploadJob = require('../../../src/modules/returns/lib/jobs/start-xml-upload');
const uploadValidator = require('../../../src/modules/returns/lib/returns-upload-validator');
const { logger } = require('@envage/water-abstraction-helpers');


experiment('postUploadXml', () => {
  let request;
  let h;

  beforeEach(async () => {
    sandbox.stub(Event.prototype, 'save').resolves({});
    sandbox.stub(Event.prototype, 'getId').returns('test-event-id');
    sandbox.stub(s3, 'upload').resolves({
      Location: 'test-s3-location',
      Key: 'test-s3-key'
    });
    sandbox.stub(startUploadJob, 'publish').resolves('test-job-id');

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
    const [eventId] = startUploadJob.publish.lastCall.args;

    expect(eventId).to.equal('test-event-id');
  });

  test('response contains the expected data', async () => {
    await controller.postUploadXml(request, h);
    const [responseData] = h.response.lastCall.args;

    expect(responseData.data.eventId).to.equal('test-event-id');
    expect(responseData.data.filename).to.equal('returns-upload/test-event-id.xml');
    expect(responseData.data.location).to.equal('test-s3-location');
    expect(responseData.data.jobId).to.equal('test-job-id');
    expect(responseData.data.statusLink).to.equal('/water/1.0/event/test-event-id');
  });
});

experiment('postUploadPreview', () => {
  const request = {
    params: {
      eventId: 'bb69e563-1a0c-4661-8e33-51ddf737740d'
    },
    payload: {
      companyId: '2dc953ff-c80e-4a1c-8f59-65c641bdbe45'
    }
  };

  let h, sandbox;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    h = {
      response: sinon.stub().returns({
        code: sinon.spy()
      })
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('returns 404 if event not found', async () => {
    sandbox.stub(Event, 'load').resolves(null);
    sandbox.stub(Boom, 'notFound');
    try {
      await controller.postUploadPreview(request, h);
    } catch (err) {
      const [message, data] = Boom.notFound.firstCall.args;
      expect(message).to.be.a.string();
      expect(data).to.equal({ eventId: request.params.eventId });
    }
  });

  experiment('when data found in S3', async () => {
    const data = { foo: 'bar' };
    const validatorResponse = { bar: 'foo' };

    beforeEach(async () => {
      sandbox.stub(Event, 'load').resolves({});
      sandbox.stub(s3, 'getObject').resolves({
        Body: Buffer.from(JSON.stringify(data), 'utf-8')
      });
      sandbox.stub(uploadValidator, 'validate').resolves(validatorResponse);
    });

    test('it should call validator with correct arguments', async () => {
      await controller.postUploadPreview(request, h);
      const [returnData, companyId] = uploadValidator.validate.firstCall.args;
      expect(returnData).to.equal(data);
      expect(companyId).to.equal(request.payload.companyId);
    });

    test('it should respond with validator result in response', async () => {
      const response = await controller.postUploadPreview(request, h);
      expect(response.error).to.equal(null);
      expect(response.data).to.equal(validatorResponse);
    });

    test('if validator fails it should reject', async () => {
      uploadValidator.validate.rejects(new Error('Some error'));
      const func = () => controller.postUploadPreview(request, h);
      expect(func()).to.reject();
    });
  });

  experiment('when data not found in S3', async () => {
    beforeEach(async () => {
      sandbox.stub(Event, 'load').resolves({});
      sandbox.stub(s3, 'getObject').rejects(new Error('Test'));
      sandbox.stub(logger, 'error');
    });

    test('it should log error', async () => {
      try {
        await controller.postUploadPreview(request, h);
      } catch (err) {

      }

      const [message, , params] = logger.error.firstCall.args;
      expect(message).to.be.a.string();
      expect(params.eventId).to.equal(request.params.eventId);
      expect(params.companyId).to.equal(request.payload.companyId);
    });
  });
});
