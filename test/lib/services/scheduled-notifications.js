'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sandbox = require('sinon').createSandbox();

const service = require('../../../src/lib/services/service');
const scheduledNotificationsService = require('../../../src/lib/services/scheduled-notifications');
const repo = require('../../../src/lib/connectors/repos/scheduled-notifications');
const mapper = require('../../../src/lib/mappers/scheduled-notification');

experiment('src/lib/services/scheduled-notifications', () => {
  beforeEach(async () => {
    sandbox.stub(service, 'findOne');
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
});
