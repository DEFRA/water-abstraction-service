'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const QueueManager = require('../../../src/lib/message-queue-v2/QueueManager');
const bull = require('bullmq');
const sandbox = require('sinon').createSandbox();

experiment('lib/message-queue-v2/QueueManager', () => {
  let queueManager, connection, jobContainer, workerStub, queueStub;

  beforeEach(async () => {
    workerStub = {
      on: sandbox.stub()
    };
    queueStub = {
      add: sandbox.stub()
    };
    connection = sandbox.stub();
    queueManager = new QueueManager(connection);
    sandbox.stub(bull, 'Queue').returns(queueStub);
    sandbox.stub(bull, 'Worker').returns(workerStub);
    sandbox.stub(bull, 'QueueScheduler');
    jobContainer = {
      jobName: 'test-job',
      handler: () => {},
      onFailed: () => {},
      createMessage: (...args) => args
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('for a simple job', () => {
    beforeEach(async () => {
      queueManager.register(jobContainer);
    });

    test('a new Bull queue is created', async () => {
      expect(bull.Queue.calledWith(
        jobContainer.jobName, { connection }
      )).to.be.true();
    });

    test('a scheduler is not created', async () => {
      expect(bull.QueueScheduler.called).to.be.false();
    });

    test('an onComplete handler is registered', async () => {
      expect(workerStub.on.calledWith(
        QueueManager.STATUS_COMPLETED
      )).to.be.false();
    });

    test('an on failed handler is registered', async () => {
      expect(workerStub.on.calledWith(
        QueueManager.STATUS_FAILED, jobContainer.onFailed
      )).to.be.true();
    });

    test('a job can be added', async () => {
      queueManager.add(jobContainer.jobName, 'foo', 'bar');
      expect(queueStub.add.calledWith('foo', 'bar')).to.be.true();
    });
  });

  experiment('for a job requiring a scheduler', () => {
    beforeEach(async () => {
      jobContainer.hasScheduler = true;
      queueManager.register(jobContainer);
    });

    test('a scheduler is created', async () => {
      expect(bull.QueueScheduler.calledWith(
        jobContainer.jobName, { connection }
      )).to.be.true();
    });
  });

  experiment('for a job with an onComplete handler', () => {
    beforeEach(async () => {
      jobContainer.onComplete = () => 'foo';
      queueManager.register(jobContainer);
    });

    test('the onComplete handler is registered', async () => {
      expect(workerStub.on.calledWith(
        QueueManager.STATUS_COMPLETED
      )).to.be.true();
    });
  });
});
