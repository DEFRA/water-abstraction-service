const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const controller = require('../../../src/modules/batch-notifications/controller');
const eventsService = require('../../../src/lib/services/events');
const Event = require('../../../src/lib/models/event');
const messageHelpers = require('../../../src/modules/batch-notifications/lib/message-helpers');
const getRecipients = require('../../../src/modules/batch-notifications/lib/jobs/get-recipients');
const { EVENT_STATUS_SENDING, EVENT_STATUS_PROCESSED } = require('../../../src/modules/batch-notifications/lib/event-statuses');
const { MESSAGE_STATUS_SENDING } = require('../../../src/modules/batch-notifications/lib/message-statuses');

const eventId = uuid();

const createEvent = () => {
  const event = new Event(eventId);
  event.fromHash({
    type: 'notification',
    eventId: 'testEvent',
    status: EVENT_STATUS_PROCESSED,
    issuer: 'mail@example.com'
  });
  return event;
};
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

    const eventModel = createEvent();

    // Other APIs
    sandbox.stub(eventsService, 'create').resolves(eventModel);
    sandbox.stub(eventsService, 'findOne').resolves(eventModel);
    sandbox.stub(eventsService, 'updateStatus').resolves(eventModel);

    sandbox.stub(getRecipients, 'publish').resolves();

    sandbox.stub(messageHelpers, 'updateMessageStatuses').resolves();
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

    test('persists an event', async () => {
      await controller.postPrepare(request, h);
      expect(eventsService.create.callCount).to.equal(1);
    });

    test('creates an event using issuer, config, and payload data', async () => {
      await controller.postPrepare(request, h);
      const event = eventsService.create.lastCall.args[0];

      expect(event.issuer).to.equal(request.payload.issuer);
      expect(event.subtype).to.equal(request.params.messageType);
      expect(event.metadata.options).to.equal(request.payload.data);
    });

    test('event metadata includes return cycle data', async () => {
      await controller.postPrepare(request, h);
      const event = eventsService.create.lastCall.args[0];
      const keys = Object.keys(event.metadata.returnCycle);
      expect(keys).to.only.include(['startDate', 'endDate', 'isSummer', 'dueDate']);
    });

    test('publishes event to start building recipient list', async () => {
      await controller.postPrepare(request, h);
      expect(getRecipients.publish.callCount).to.equal(1);
      const [eventId] = getRecipients.publish.lastCall.args;
      expect(eventId).to.equal(eventId);
    });

    test('responds with event data', async () => {
      const response = await controller.postPrepare(request, h);
      expect(response.error).to.equal(null);
      expect(response.data.id).to.equal(eventId);
    });

    test('responds with a 500 error if an error is thrown', async () => {
      eventsService.create.throws();
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
      eventsService.findOne.resolves(null);
      await controller.postSend(request, h);
      expectErrorResponse(404);
    });

    test('throws 400 error if event not a "notification"', async () => {
      eventsService.findOne.resolves(
        createEvent().fromHash({
          type: 'not-a-notification'
        })
      );
      await controller.postSend(request, h);
      expectErrorResponse(400);
    });

    test('throws 400 error if event not in "processed" status', async () => {
      eventsService.findOne.resolves(
        createEvent().fromHash({
          status: EVENT_STATUS_SENDING
        })
      );
      await controller.postSend(request, h);
      expectErrorResponse(400);
    });

    test('throws 401 error if issuer does not match', async () => {
      eventsService.findOne.resolves(
        createEvent().fromHash({
          issuer: 'unknown@example.com'
        })
      );
      await controller.postSend(request, h);
      expectErrorResponse(401);
    });

    test('updates event and message statuses', async () => {
      await controller.postSend(request, h);
      const { args: messageArgs } = messageHelpers.updateMessageStatuses.lastCall;
      expect(messageArgs[0]).to.equal(eventId);
      expect(messageArgs[1]).to.equal(MESSAGE_STATUS_SENDING);
      const { args: eventArgs } = eventsService.updateStatus.lastCall;
      expect(eventArgs[0]).to.equal(eventId);
      expect(eventArgs[1]).to.equal(EVENT_STATUS_SENDING);
    });

    test('responds with updated event data', async () => {
      const response = await controller.postSend(request, h);
      expect(response.error).to.be.null();
      expect(response.data.id).to.equal(eventId);
    });

    test('responds with 500 error if an error is thrown', async () => {
      eventsService.updateStatus.rejects();
      await controller.postSend(request, h);
      expectErrorResponse(500);
    });
  });
});
