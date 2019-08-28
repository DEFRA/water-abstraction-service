const Boom = require('@hapi/boom');
const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');

const preHandlers = require('../../../src/modules/returns/pre-handlers');
const event = require('../../../src/lib/event');
const returnsUpload = require('../../../src/modules/returns/lib/returns-upload');

const eventId = 'df1c0fcc-9ef1-4287-8d6a-e80e451fb987';

const requestFactory = () => {
  return {
    params: {
      eventId
    },
    query: {
      userName: 'bob@example.com'
    }
  };
};

const h = { continue: 'CONTINUE' };

const evt = {
  eventId,
  referenceCode: 'TEST',
  issuer: 'bob@example.com'
};

const data = {
  foo: 'bar'
};

experiment('preLoadEvent', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(async () => {
    sandbox.stub(event, 'load').resolves(evt);
    sandbox.stub(Boom, 'notFound').throws();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('it should load the event with the ID specified in the params', async () => {
    const request = requestFactory();
    await preHandlers.preLoadEvent(request, h);
    const [ id ] = event.load.firstCall.args;
    expect(id).to.equal(eventId);
  });

  test('it should place the loaded event at request.evt', async () => {
    const request = requestFactory();
    await preHandlers.preLoadEvent(request, h);
    expect(request.evt).to.equal(evt);
  });

  test('it should return h.continue', async () => {
    const request = requestFactory();
    const result = await preHandlers.preLoadEvent(request, h);
    expect(result).to.equal(h.continue);
  });

  test('it should throw Boom.notFound if event not loaded', async () => {
    event.load.resolves(null);
    const request = requestFactory();
    try {
      await preHandlers.preLoadEvent(request, h);
    } catch (err) {
      expect(Boom.notFound.callCount).to.equal(1);
      expect(Boom.notFound.firstCall.args[1].eventId).to.equal(eventId);
    }
  });
});

experiment('preLoadJson', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(async () => {
    sandbox.stub(returnsUpload, 'getReturnsS3Object').resolves({
      Body: Buffer.from(JSON.stringify(data), 'utf-8')
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('it should load the correct object from S3', async () => {
    const request = requestFactory();
    await preHandlers.preLoadJson(request, h);
    const { args } = returnsUpload.getReturnsS3Object.firstCall;
    expect(args[0]).to.equal(eventId);
    expect(args[1]).to.equal('json');
  });

  test('it should place the data from the buffer on request.jsonData', async () => {
    const request = requestFactory();
    await preHandlers.preLoadJson(request, h);
    expect(request.jsonData).to.equal(data);
  });

  test('it throws an error if the object not loaded from S3', async () => {
    returnsUpload.getReturnsS3Object.throws();
    const request = requestFactory();
    const func = () => preHandlers.preLoadJson(request, h);
    expect(func()).to.reject();
  });
});

experiment('preCheckIssuer', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(async () => {
    sandbox.stub(Boom, 'unauthorized');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('returns h.continue if the username in the payload matches event issuer', async () => {
    const request = requestFactory();
    request.evt = evt;
    const result = await preHandlers.preCheckIssuer(request, h);
    expect(result).to.equal(h.continue);
  });

  test('throws Boom.unauthorized error if username in payload does not match event issuer', async () => {
    const request = requestFactory();
    request.query.userName = 'invisible@example.com';
    request.evt = evt;
    try {
      await preHandlers.preCheckIssuer(request, h);
    } catch (err) {

    }
    expect(Boom.unauthorized.callCount).to.equal(1);
    const [, params] = Boom.unauthorized.firstCall.args;
    expect(params.eventId).to.equal(eventId);
    expect(params.userName).to.equal(request.query.userName);
  });
});
