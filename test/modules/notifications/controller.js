'use strict';

const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { pick } = require('lodash');
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const sandbox = require('sinon').createSandbox();

const controller = require('../../../src/modules/notifications/controller');
const Event = require('../../../src/lib/models/event');
const NotificationEvent = require('../../../src/lib/models/notification-event');
const Pagination = require('../../../src/lib/models/pagination');

const eventsService = require('../../../src/lib/services/events');
const scheduledNotificationsService = require('../../../src/lib/services/scheduled-notifications');

const eventId = uuid();

const id = uuid();

const createNotificationEvent = () => new NotificationEvent(eventId).fromHash({
  issuer: 'somebody@example.com',
  type: Event.eventTypes.notification,
  subtype: 'paperForms',
  recipientCount: 4,
  errorCount: 1,
  created: '2021-01-01',
  referenceCode: 'ABC123',
  metadata: {
    name: 'Test name'
  }
});

experiment('modules/notifications/controller', () => {
  beforeEach(async () => {
    sandbox.stub(eventsService, 'getNotificationEvents');
    sandbox.stub(scheduledNotificationsService, 'getByEventId');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getNotifications', () => {
    let request, response, event, pagination;

    beforeEach(async () => {
      event = createNotificationEvent();
      pagination = new Pagination().fromHash({ page: 3 });
      eventsService.getNotificationEvents.resolves({
        pagination,
        data: [
          event
        ]
      });
      request = {
        query: {
          page: 3
        }
      };
      response = await controller.getNotifications(request);
    });

    test('gets the notifications from the events service', async () => {
      expect(eventsService.getNotificationEvents.calledWith(request.query.page));
    });

    test('response contains a .data array of notification events', async () => {
      const { data } = response;
      expect(data).to.be.an.array().length(1);
      expect(data[0]).to.equal({
        ...pick(event, 'id', 'issuer', 'type', 'subtype', 'recipientCount', 'errorCount', 'created', 'referenceCode'),
        name: event.metadata.name
      });
    });

    test('response contains a .pagination object', async () => {
      const { pagination } = response;
      expect(pagination).to.equal(pagination);
    });
  });

  experiment('.getNotification', () => {
    let request, response, event;

    beforeEach(async () => {
      event = createNotificationEvent();
      request = {
        pre: {
          event
        }
      };
      response = await controller.getNotification(request);
    });

    test('resolves with the mapped request.pre.event', async () => {
      expect(response).to.equal({
        ...pick(event, 'id', 'issuer', 'type', 'subtype', 'recipientCount', 'errorCount', 'created', 'referenceCode'),
        name: event.metadata.name
      });
    });
  });

  experiment('.getNotificationMessages', () => {
    let request, response;

    beforeEach(async () => {
      request = {
        params: {
          eventId
        }
      };
      scheduledNotificationsService.getByEventId.resolves([]);
      response = await controller.getNotificationMessages(request);
    });

    test('calls the service method', async () => {
      expect(scheduledNotificationsService.getByEventId.calledWith(
        eventId
      )).to.be.true();
    });

    test('resolves with { data: [] } shape', async () => {
      expect(response).to.equal({ data: [] });
    });
  });

  experiment('.getNotificationMessage', () => {
    let request, response;

    beforeEach(async () => {
      request = {
        params: {
          id
        }
      };
      scheduledNotificationsService.getScheduledNotificationById.resolves({ something: 'something' });
      response = await controller.getNotificationMessage(request);
    });

    test('calls the service method', async () => {
      expect(scheduledNotificationsService.getScheduledNotificationById.calledWith(
        id
      )).to.be.true();
    });

    test('resolves with { data: {expectedObject} } shape', async () => {
      expect(response).to.equal({ data: { something: 'something' } });
    });
  });
});
