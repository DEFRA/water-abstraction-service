'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const uuid = require('uuid/v4');

const sandbox = require('sinon').createSandbox();

const service = require('../../../src/lib/services/service');
const ScheduledNofication = require('../../../src/lib/models/scheduled-notification');
const scheduledNotificationsService = require('../../../src/lib/services/scheduled-notifications');
const repo = require('../../../src/lib/connectors/repos/scheduled-notifications');
const mapper = require('../../../src/lib/mappers/scheduled-notification');

experiment('src/lib/services/scheduled-notifications', () => {
  beforeEach(async () => {
    sandbox.stub(service, 'findOne');
    sandbox.stub(repo, 'create');
    sandbox.stub(repo, 'findByEventId');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getScheduledNotificationById', () => {
    test('delegates to the findOne() service helper', async () => {
      const id = '370851ec-1861-4069-9590-475269f9b011';
      await scheduledNotificationsService.getScheduledNotificationById(id);

      expect(service.findOne.calledWith(
        id,
        repo.findOne,
        mapper
      )).to.be.true();
    });
  });

  experiment('.createScheduledNotification', () => {
    let result;

    beforeEach(async () => {
      const notification = new ScheduledNofication();
      notification.personalisation = { one: 1 };
      notification.messageRef = 'test-ref';

      repo.create.resolves({
        id: '11111111-2222-3333-4444-555555555555'
      });

      result = await scheduledNotificationsService.createScheduledNotification(notification);
    });

    test('saves the entity', async () => {
      const [row] = repo.create.lastCall.args;
      expect(row.personalisation.one).to.equal(1);
      expect(row.messageRef).to.equal('test-ref');
    });

    test('returns a model object with the updated id', async () => {
      expect(result).to.be.instanceOf(ScheduledNofication);
      expect(result.id).to.equal('11111111-2222-3333-4444-555555555555');
    });
  });

  experiment('.getByEventId', () => {
    const eventId = uuid();
    let result;

    beforeEach(async () => {
      repo.findByEventId.resolves([{
        eventId
      }]);
      result = await scheduledNotificationsService.getByEventId(eventId);
    });

    test('calls the repo .findByEventId method', async () => {
      expect(repo.findByEventId.calledWith(eventId)).to.be.true();
    });

    test('resolves with an array of ScheduledNotification models', async () => {
      expect(result).to.be.an.array().length(1);
      expect(result.every(item => item instanceof ScheduledNofication)).to.be.true();
    });
  });
});
