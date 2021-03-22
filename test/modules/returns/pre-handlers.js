const Boom = require('@hapi/boom');
const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');

const preHandlers = require('../../../src/modules/returns/pre-handlers');
const returnsUpload = require('../../../src/modules/returns/lib/returns-upload');
const eventsService = require('../../../src/lib/services/events');
const returnCyclesService = require('../../../src/lib/services/return-cycles');
const Event = require('../../../src/lib/models/event');

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

const createEvent = () => {
  const event = new Event(eventId);
  return event.fromHash({
    referenceCode: 'TEST',
    issuer: 'bob@example.com'
  });
};

const data = {
  foo: 'bar'
};

experiment('modules/reutrns/pre-handlers', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(async () => {
    sandbox.stub(returnCyclesService, 'getReturnCycleById');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('preLoadEvent', () => {
    beforeEach(async () => {
      sandbox.stub(eventsService, 'findOne').resolves(createEvent());
      sandbox.stub(Boom, 'notFound').throws();
    });

    test('it should load the event with the ID specified in the params', async () => {
      const request = requestFactory();
      await preHandlers.preLoadEvent(request, h);
      const [id] = eventsService.findOne.firstCall.args;
      expect(id).to.equal(eventId);
    });

    test('it should place the loaded event at request.event', async () => {
      const request = requestFactory();
      await preHandlers.preLoadEvent(request, h);
      expect(request.event instanceof Event).to.be.true();
    });

    test('it should return h.continue', async () => {
      const request = requestFactory();
      const result = await preHandlers.preLoadEvent(request, h);
      expect(result).to.equal(h.continue);
    });

    test('it should throw Boom.notFound if event not loaded', async () => {
      eventsService.findOne.resolves(null);
      const request = requestFactory();
      try {
        await preHandlers.preLoadEvent(request, h);
        fail();
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
      request.event = createEvent();
      const result = await preHandlers.preCheckIssuer(request, h);
      expect(result).to.equal(h.continue);
    });

    test('throws Boom.unauthorized error if username in payload does not match event issuer', async () => {
      const request = requestFactory();
      request.query.userName = 'invisible@example.com';
      request.event = createEvent();
      try {
        await preHandlers.preCheckIssuer(request, h);
        fail();
      } catch (err) {
        expect(Boom.unauthorized.callCount).to.equal(1);
      }
    });
  });

  experiment('.getReturnCycle', () => {
    let response;
    const returnCycleId = 'test-id';
    const request = {
      params: {
        returnCycleId
      }
    };

    experiment('when a return cycle is found', () => {
      beforeEach(async () => {
        returnCyclesService.getReturnCycleById.resolves({
          returnCycleId
        });
        response = await preHandlers.getReturnCycle(request);
      });

      test('calls the expected service method', async () => {
        expect(returnCyclesService.getReturnCycleById.calledWith(
          returnCycleId
        )).to.be.true();
      });

      test('resolves with the result', async () => {
        expect(response).to.equal({ returnCycleId });
      });
    });

    experiment('when a return cycle is not found', () => {
      beforeEach(async () => {
        returnCyclesService.getReturnCycleById.resolves(null);
        response = await preHandlers.getReturnCycle(request);
      });

      test('resolves with Boom not found', async () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.statusCode).to.equal(404);
      });
    });
  });
});
