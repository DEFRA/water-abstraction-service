const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const sinon = require('sinon');
const sandbox = require('sinon').createSandbox();

const scheduledNotificationsService = require('../../../src/lib/services/scheduled-notifications');
const controller = require('../../../src/modules/notify/controller');

experiment('modules/notify/controller', () => {
  beforeEach(async () => {
    sandbox.stub(scheduledNotificationsService, 'getScheduledNotificationByNotifyId');
    sandbox.stub(scheduledNotificationsService, 'updateScheduledNotificationWithNotifyCallback');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.callback', () => {
    let response;
    const tempId = uuid();
    const request = {
      payload: {
        reference: tempId,
        status: 'delivered'
      }
    };
    const h = {
      response: sinon.stub().returns({
        code: sinon.spy()
      })
    };
    experiment('when no matching notification is found', () => {
      beforeEach(async () => {
        await scheduledNotificationsService.getScheduledNotificationByNotifyId.returns(null);
        await scheduledNotificationsService.updateScheduledNotificationWithNotifyCallback.resolves();
        response = await controller.callback(request, h);
      });

      test('returns a Boom 404', async () => {
        expect(response.isBoom).to.equal(true);
        expect(response.output.statusCode).to.equal(404);
      });

      test('does not call the update function', () => {
        expect(scheduledNotificationsService.updateScheduledNotificationWithNotifyCallback.called).to.be.false();
      });
    });

    experiment('when a matching notification is found', () => {
      beforeEach(async () => {
        await scheduledNotificationsService.getScheduledNotificationByNotifyId.returns(1);
        await scheduledNotificationsService.updateScheduledNotificationWithNotifyCallback.resolves();
        response = await controller.callback(request, h);
      });

      test('calls the update function', () => {
        expect(scheduledNotificationsService.updateScheduledNotificationWithNotifyCallback.called).to.be.true();
      });
    });
  });
});
