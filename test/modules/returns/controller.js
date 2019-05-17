const { expect } = require('code');
const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('../../../src/modules/returns/controller');
const event = require('../../../src/lib/event');
const s3 = require('../../../src/lib/connectors/s3');
const startUploadJob = require('../../../src/modules/returns/lib/jobs/start-upload');
const persistReturnsJob = require('../../../src/modules/returns/lib/jobs/persist-returns');
const uploadValidator = require('../../../src/modules/returns/lib/returns-upload-validator');
const { logger } = require('../../../src/logger');
const returnsConnector = require('../../../src/lib/connectors/returns');
const { uploadStatus } = require('../../../src/modules/returns/lib/returns-upload');

const UUIDV4_REGEX = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

experiment('postUpload', () => {
  let request;
  let h;

  beforeEach(async () => {
    sandbox.stub(event.repo, 'update').resolves({});
    sandbox.stub(event.repo, 'create').resolves({});

    sandbox.stub(s3, 'upload').resolves({
      Location: 'test-s3-location',
      Key: 'test-s3-key'
    });
    sandbox.stub(startUploadJob, 'publish').resolves('test-job-id');

    request = {
      payload: {
        userName: 'test-user',
        fileData: '10101'
      },
      params: {
        type: 'xml'
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
    await controller.postUpload(request, h);
    const [eventValues] = event.repo.create.firstCall.args;
    expect(eventValues.type).to.equal('returns-upload');
    expect(eventValues.subtype).to.equal('xml');
    expect(eventValues.issuer).to.equal('test-user');
    expect(eventValues.status).to.equal('processing');
  });

  test('file data is uploaded to S3', async () => {
    await controller.postUpload(request, h);
    const [filename, fileData] = s3.upload.lastCall.args;

    expect(filename.substr(0, 15)).to.equal('returns-upload/');
    expect(filename.substr(15, 36)).to.match(UUIDV4_REGEX);
    expect(filename.substr(51, 4)).to.equal('.xml');

    expect(fileData).to.equal('10101');
  });

  test('creates a new job for the task queue', async () => {
    await controller.postUpload(request, h);
    const [eventId] = startUploadJob.publish.lastCall.args;

    expect(eventId).to.match(UUIDV4_REGEX);
  });

  test('response contains the expected data', async () => {
    await controller.postUpload(request, h);
    const [responseData] = h.response.lastCall.args;

    expect(responseData.data.eventId).to.match(UUIDV4_REGEX);

    const expectedFilename = `returns-upload/${responseData.data.eventId}.xml`;
    expect(responseData.data.filename).to.equal(expectedFilename);

    expect(responseData.data.location).to.equal('test-s3-location');
    expect(responseData.data.jobId).to.equal('test-job-id');

    const expectedStatusLink = `/water/1.0/event/${responseData.data.eventId}`;
    expect(responseData.data.statusLink).to.equal(expectedStatusLink);
  });
});

const requestFactory = (returnId) => {
  return {
    params: {
      eventId: 'bb69e563-1a0c-4661-8e33-51ddf737740d',
      returnId
    },
    query: {
      companyId: '2dc953ff-c80e-4a1c-8f59-65c641bdbe45'
    },
    evt: {
      eventId: 'bb69e563-1a0c-4661-8e33-51ddf737740d',
      status: 'validated'
    },
    jsonData: [{
      returnId: 'x',
      lines: []
    }, {
      returnId: 'y',
      lines: []
    }]
  };
};

const validatorResponseFactory = (returnId) => {
  const request = requestFactory(returnId);
  return request.jsonData.map(ret => ({
    ...ret,
    errors: []
  }));
};

experiment('getUploadPreview', () => {
  let validatorResponse;

  let h;

  beforeEach(async () => {
    validatorResponse = validatorResponseFactory();
    h = {
      response: sinon.stub().returns({
        code: sinon.spy()
      })
    };
    sandbox.stub(logger, 'error');
    sandbox.stub(uploadValidator, 'validate').resolves(validatorResponse);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('it should call validator with correct arguments', async () => {
    const request = requestFactory();
    await controller.getUploadPreview(request, h);
    const [returnData, companyId] = await uploadValidator.validate.firstCall.args;
    expect(returnData).to.equal(request.jsonData);
    expect(companyId).to.equal(request.query.companyId);
  });

  test('it should respond with validator result in response', async () => {
    const request = requestFactory();
    const response = await controller.getUploadPreview(request, h);
    expect(response.error).to.equal(null);
    expect(response.data[0].returnId).to.equal(validatorResponse[0].returnId);
    expect(response.data[1].returnId).to.equal(validatorResponse[1].returnId);
  });

  test('if validator fails it should reject', async () => {
    const request = requestFactory();
    uploadValidator.validate.rejects(new Error('Some error'));
    const func = () => controller.getUploadPreview(request, h);
    expect(func()).to.reject();
  });

  test('if validator fails it should log error', async () => {
    const request = requestFactory();
    uploadValidator.validate.rejects(new Error('Some error'));
    try {
      await controller.getUploadPreview(request, h);
      fail('Controller method should not resolve');
    } catch (err) {

    }

    const [msg, , params] = logger.error.lastCall.args;
    expect(msg).to.be.a.string();

    expect(params.eventId).to.equal(request.params.eventId);
    expect(params.companyId).to.equal(request.query.companyId);
  });
});

experiment('getUploadPreviewReturn', () => {
  let h;

  const returnServiceResponse = {
    error: null,
    data: {
      metadata: {
        foo: 'bar'
      }
    }
  };

  const uploadedReturns = [{
    returnId: 'x',
    isNil: false,
    lines: [{
      quantity: 2
    }, {
      quantity: 3
    }]
  }, {
    returnId: 'y',
    isNil: true
  }];

  beforeEach(async () => {
    h = {
      response: sinon.stub().returns({
        code: sinon.spy()
      })
    };
    sandbox.stub(logger, 'error');
    sandbox.stub(uploadValidator, 'validate').resolves(uploadedReturns);
    sandbox.stub(returnsConnector.returns, 'findOne').resolves(returnServiceResponse);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('throws a 404 error if the requested return ID is not in the array', async () => {
    const request = requestFactory('z');
    try {
      await controller.getUploadPreviewReturn(request, h);
      fail('Controller method should not resolve');
    } catch (err) {
      expect(err.isBoom).to.equal(true);
      expect(err.output.statusCode).to.equal(404);
    }
  });

  test('calls validator with the return specified in the request', async () => {
    const request = requestFactory('x');
    await controller.getUploadPreviewReturn(request, h);
    const [returns, companyId] = uploadValidator.validate.lastCall.args;
    expect(returns.length).to.equal(1);
    expect(returns[0].returnId).to.equal('x');
    expect(companyId).to.equal(request.query.companyId);
  });

  test('throws an error if error in return service response', async () => {
    const request = requestFactory('x');
    returnsConnector.returns.findOne.resolves({ error: 'oh no' });
    const func = () => controller.getUploadPreviewReturn(request, h);
    expect(func()).to.reject();
  });

  test('it should responsd with the return', async () => {
    const request = requestFactory('x');
    const response = await controller.getUploadPreviewReturn(request, h);
    expect(response.error).to.equal(null);
    expect(response.data.returnId).to.equal('x');
    expect(response.data.metadata).to.equal(returnServiceResponse.data.metadata);
    expect(response.data.totalVolume).to.equal(5);
  });
});

experiment('postUploadSubmit', () => {
  let h;

  beforeEach(async () => {
    sandbox.stub(logger, 'error');
    sandbox.stub(event, 'save');
    h = {
      response: sinon.stub().returns({
        code: sinon.spy()
      })
    };
    sandbox.stub(uploadValidator, 'validate').resolves([{
      returnId: 'a',
      errors: []
    }, {
      returnId: 'b',
      errors: ['Some error']
    }
    ]);
    sandbox.stub(persistReturnsJob, 'publish').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('it should throw a bad request error if the event is the wrong status', async () => {
    const request = requestFactory();
    request.evt.status = 'submitted';

    try {
      await controller.postUploadSubmit(request, h);
      fail('Controller method should not resolve');
    } catch (err) {
      expect(err.isBoom).to.equal(true);
      expect(err.output.statusCode).to.equal(400);
    }
    const [msg, , params] = logger.error.lastCall.args;
    expect(msg).to.be.a.string();
    expect(params.eventId).to.equal(request.params.eventId);
    expect(params.companyId).to.equal(request.query.companyId);
  });

  test('it should throw a bad request error if no returns to submit', async () => {
    const request = requestFactory();
    uploadValidator.validate.resolves([]);
    try {
      await controller.postUploadSubmit(request, h);
      fail('Controller method should not resolve');
    } catch (err) {
      expect(err.isBoom).to.equal(true);
      expect(err.output.statusCode).to.equal(400);
    }
    const [msg, , params] = logger.error.lastCall.args;
    expect(msg).to.be.a.string();
    expect(params.eventId).to.equal(request.params.eventId);
    expect(params.companyId).to.equal(request.query.companyId);
  });

  experiment('when there are returns to submit', async () => {
    test('it should update the event status to "submitted"', async () => {
      const request = requestFactory();
      await controller.postUploadSubmit(request, h);
      const [{ eventId, status }] = event.save.lastCall.args;
      expect(eventId).to.equal(request.params.eventId);
      expect(status).to.equal(uploadStatus.SUBMITTING);
    });
  });
});
