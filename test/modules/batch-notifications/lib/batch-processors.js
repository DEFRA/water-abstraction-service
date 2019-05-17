const { logger } = require('../../../../src/logger');
const { expect } = require('code');
const {
  beforeEach,
  experiment,
  test,
  afterEach
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const batchProcessors =
require('../../../../src/modules/batch-notifications/lib/batch-processors');

const queries =
  require('../../../../src/modules/batch-notifications/lib/queries');

// Jobs
const sendMessage =
  require('../../../../src/modules/batch-notifications/lib/jobs/send-message');
const refreshEvent =
  require('../../../../src/modules/batch-notifications/lib/jobs/refresh-event');
const checkStatus =
    require('../../../../src/modules/batch-notifications/lib/jobs/check-status');

experiment('batch processors', () => {
  const messageBatch = [{
    id: 'message_1'
  }, {
    id: 'message_2'
  }];

  const eventBatch = [{
    event_id: 'event_1'
  }, {
    event_id: 'event_2'
  }];

  beforeEach(async () => {
    sandbox.stub(queries, 'getSendingMessageBatch').resolves(messageBatch);
    sandbox.stub(queries, 'getSendingEvents').resolves(eventBatch);
    sandbox.stub(queries, 'getNotifyStatusChecks').resolves(messageBatch);
    sandbox.stub(sendMessage, 'publish').resolves();
    sandbox.stub(refreshEvent, 'publish').resolves();
    sandbox.stub(checkStatus, 'publish').resolves();
    sandbox.stub(logger, 'info');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('sendMessageBatch', () => {
    beforeEach(async () => {
      await batchProcessors.sendMessageBatch();
    });

    test('loads message batch from queries.getSendingMessageBatch', async () => {
      expect(queries.getSendingMessageBatch.callCount).to.equal(1);
    });

    test('logs an info level message', async () => {
      expect(logger.info.callCount).to.equal(1);
      const [ str ] = logger.info.lastCall.args;
      expect(str).to.be.a.string();
    });

    test('publishes a send message job for each message in batch', async () => {
      expect(sendMessage.publish.callCount).to.equal(2);
      const [ firstId ] = sendMessage.publish.getCall(0).args;
      expect(firstId).to.equal('message_1');
      const [ secondId ] = sendMessage.publish.getCall(1).args;
      expect(secondId).to.equal('message_2');
    });
  });

  experiment('refreshEvents', () => {
    beforeEach(async () => {
      await batchProcessors.refreshEvents();
    });

    test('loads event batch from queries.getSendingEvents', async () => {
      expect(queries.getSendingEvents.callCount).to.equal(1);
    });

    test('logs an info level message', async () => {
      expect(logger.info.callCount).to.equal(1);
      const [ str ] = logger.info.lastCall.args;
      expect(str).to.be.a.string();
    });

    test('publishes a refresh event job for each event in batch', async () => {
      expect(refreshEvent.publish.callCount).to.equal(2);
      const [ firstId ] = refreshEvent.publish.getCall(0).args;
      expect(firstId).to.equal('event_1');
      const [ secondId ] = refreshEvent.publish.getCall(1).args;
      expect(secondId).to.equal('event_2');
    });
  });

  experiment('checkNotifyStatuses', () => {
    beforeEach(async () => {
      await batchProcessors.checkNotifyStatuses();
    });

    test('loads event batch from queries.getNotifyStatusChecks', async () => {
      expect(queries.getNotifyStatusChecks.callCount).to.equal(1);
    });

    test('logs an info level message', async () => {
      expect(logger.info.callCount).to.equal(1);
      const [ str ] = logger.info.lastCall.args;
      expect(str).to.be.a.string();
    });

    test('publishes a check status job for each message in batch', async () => {
      expect(checkStatus.publish.callCount).to.equal(2);
      const [ firstId ] = checkStatus.publish.getCall(0).args;
      expect(firstId).to.equal('message_1');
      const [ secondId ] = checkStatus.publish.getCall(1).args;
      expect(secondId).to.equal('message_2');
    });
  });
});
