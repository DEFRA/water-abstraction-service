const { expect } = require('code');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const messageQueue = require('../../../../../src/lib/message-queue');
const checkStatus = require('../../../../../src/modules/batch-notifications/lib/jobs/check-status');
const messageHelpers = require('../../../../../src/modules/batch-notifications/lib/message-helpers');
const scheduledNotifications = require('../../../../../src/controllers/notifications.js');
const notify = require('../../../../../src/lib/notify');
const { logger } = require('../../../../../src/logger');

experiment('checkStatus job', () => {
  const messageId = 'message_1';
  const notifyId = 'notify_id';
  const status = 'testStatus';

  beforeEach(async () => {
    sandbox.stub(messageQueue, 'publish').resolves();
    sandbox.stub(messageHelpers, 'getMessageById')
      .resolves({ id: messageId, notify_id: notifyId });
    sandbox.stub(scheduledNotifications.repository, 'update').resolves();
    sandbox.stub(notify, 'getStatus').resolves(status);
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the job name should be notifications.checkStatus', async () => {
    expect(checkStatus.jobName).to.equal('notifications.checkStatus');
  });

  experiment('publish', () => {
    beforeEach(async () => {
      await checkStatus.publish(messageId);
    });
    test('publishes a job with the correct job name', async () => {
      const [jobName] = messageQueue.publish.lastCall.args;
      expect(jobName).to.equal(checkStatus.jobName);
    });
    test('includes the message ID in the job data', async () => {
      const [, data] = messageQueue.publish.lastCall.args;
      expect(data).to.equal({ messageId });
    });
    test('uses the message ID as a singleton key in the job options', async () => {
      const [, , options] = messageQueue.publish.lastCall.args;
      expect(options).to.equal({ singletonKey: messageId });
    });
  });

  experiment('handleCheckStatus', () => {
    experiment('when there is an error', () => {
      const err = new Error('Oh no!');

      beforeEach(async () => {
        const jobData = { data: { messageId } };
        scheduledNotifications.repository.update.throws(err);
        await checkStatus.handler(jobData);
      });

      test('logs the error', async () => {
        const [ msg, error, params ] = logger.error.lastCall.args;
        expect(msg).to.be.a.string();
        expect(error).to.equal(err);
        expect(params).to.equal({ messageId });
      });
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        const jobData = { data: { messageId } };
        await checkStatus.handler(jobData);
      });
      test('loads the scheduled_notification with the ID in the job data', async () => {
        const { args } = messageHelpers.getMessageById.lastCall;
        expect(args).to.equal([messageId]);
      });
      test('calls Notify getStatus API with correct Notify message ID', async () => {
        const { args } = notify.getStatus.lastCall;
        expect(args).to.equal([notifyId]);
      });
      test('updates scheduled_notification with new status and next check times', async () => {
        const [ filter, data ] = scheduledNotifications.repository.update.lastCall.args;
        expect(filter).to.equal({ id: messageId });
        expect(data.next_status_check).to.be.a.string();
        expect(data.status_checks).to.be.a.number();
        expect(data.notify_status).to.equal(status);
      });
    });
  });
});
