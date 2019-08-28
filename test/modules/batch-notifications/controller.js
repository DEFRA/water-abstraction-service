const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('../../../src/modules/batch-notifications/controller');
const eventHelpers = require('../../../src/modules/batch-notifications/lib/event-helpers');
const messageHelpers = require('../../../src/modules/batch-notifications/lib/message-helpers');
const getRecipients = require('../../../src/modules/batch-notifications/lib/jobs/get-recipients');
const { EVENT_STATUS_SENDING, EVENT_STATUS_PROCESSED } = require('../../../src/modules/batch-notifications/lib/event-statuses');
const { MESSAGE_STATUS_SENDING } = require('../../../src/modules/batch-notifications/lib/message-statuses');

const evt = require('../../../src/lib/event');

experiment('batch notifications controller', () => {
  let request, h, code;

  const expectErrorResponse = statusCode => {
    const [response] = h.response.lastCall.args;
    expect(response.error).to.be.a.string();
    expect(response.data).to.equal(null);
    const [status] = code.lastCall.args;
    expect(status).to.equal(statusCode);
  };

  beforeEach(async () => {
    // Stub HAPI response toolkit
    code = sandbox.stub();
    h = {
      response: sandbox.stub().returns({
        code
      })
    };

    // Other APIs
    sandbox.stub(eventHelpers, 'createEvent').resolves({
      eventId: 'testEvent'
    });
    sandbox.stub(getRecipients, 'publish').resolves();
    sandbox.stub(evt, 'load').resolves({
      type: 'notification',
      eventId: 'testEvent',
      status: EVENT_STATUS_PROCESSED,
      issuer: 'mail@example.com'
    });
    sandbox.stub(messageHelpers, 'updateMessageStatuses').resolves();
    sandbox.stub(eventHelpers, 'updateEventStatus').resolves();
  });

  afterEach(async () => sandbox.restore());

  experiment('postPrepare', () => {
    beforeEach(async () => {
      request = {
        params: {
          messageType: 'returnReminder'
        },
        payload: {
          issuer: 'mail@example.com',
          data: {
            excludeLicences: ['01/123']
          }
        }
      };
    });

    test('responds with a 400 error if the request payload doesnt validate', async () => {
      request.payload.data.foo = 'bar';
      await controller.postPrepare(request, h);
      expectErrorResponse(400);
    });

    test('creates an event using issuer, config, and payload data', async () => {
      await controller.postPrepare(request, h);
      const [issuer, config, data] = eventHelpers.createEvent.lastCall.args;
      expect(issuer).to.equal(request.payload.issuer);
      expect(config.messageType).to.equal(request.params.messageType);
      expect(data).to.equal(request.payload.data);
    });

    test('publishes event to start building recipient list', async () => {
      await controller.postPrepare(request, h);
      expect(getRecipients.publish.callCount).to.equal(1);
      const [eventId] = getRecipients.publish.lastCall.args;
      expect(eventId).to.equal('testEvent');
    });

    test('responds with event data', async () => {
      const response = await controller.postPrepare(request, h);
      expect(response.error).to.equal(null);
      expect(response.data.eventId).to.equal('testEvent');
    });

    test('responds with a 500 error if an error is thrown', async () => {
      eventHelpers.createEvent.throws();
      await controller.postPrepare(request, h);
      expectErrorResponse(500);
    });
  });

  experiment('postSend', () => {
    beforeEach(async () => {
      request = {
        params: {
          eventId: 'testEvent'
        },
        payload: {
          issuer: 'mail@example.com'
        }
      };
    });

    test('throws 404 error if event not found', async () => {
      evt.load.resolves(null);
      await controller.postSend(request, h);
      expectErrorResponse(404);
    });

    test('throws 400 error if event not a "notification"', async () => {
      evt.load.resolves({
        type: 'notANotification'
      });
      await controller.postSend(request, h);
      expectErrorResponse(400);
    });

    test('throws 400 error if event not in "processed" status', async () => {
      evt.load.resolves({
        type: 'notification',
        status: EVENT_STATUS_SENDING
      });
      await controller.postSend(request, h);
      expectErrorResponse(400);
    });

    test('throws 400 error if event not in "processed" status', async () => {
      evt.load.resolves({
        type: 'notification',
        status: EVENT_STATUS_SENDING
      });
      await controller.postSend(request, h);
      expectErrorResponse(400);
    });

    test('throws 401 error if issuer does not match', async () => {
      evt.load.resolves({
        issuer: 'unknown@example.com',
        type: 'notification',
        status: EVENT_STATUS_PROCESSED
      });
      await controller.postSend(request, h);
      expectErrorResponse(401);
    });

    test('updates event and message statuses', async () => {
      await controller.postSend(request, h);
      const { args: messageArgs } = messageHelpers.updateMessageStatuses.lastCall;
      expect(messageArgs[0]).to.equal('testEvent');
      expect(messageArgs[1]).to.equal(MESSAGE_STATUS_SENDING);
      const { args: eventArgs } = eventHelpers.updateEventStatus.lastCall;
      expect(eventArgs[0]).to.equal('testEvent');
      expect(eventArgs[1]).to.equal(EVENT_STATUS_SENDING);
    });

    test('responds with updated event data', async () => {
      const data = { eventId: 'testEvent', status: EVENT_STATUS_SENDING };
      eventHelpers.updateEventStatus.resolves(data);
      const response = await controller.postSend(request, h);
      expect(response).to.equal({
        data,
        error: null
      });
    });

    test('responds with 500 error if an error is thrown', async () => {
      eventHelpers.updateEventStatus.rejects();
      await controller.postSend(request, h);
      expectErrorResponse(500);
    });
  });
});
