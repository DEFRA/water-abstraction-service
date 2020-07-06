'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const helpers = require('../../../../../src/modules/billing/bull-jobs/lib/helpers');

const queueFactory = require('../../../../../src/modules/billing/bull-jobs/lib/queue-factory');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('modules/billing/bull-jobs/lib/queue-factory', () => {
  let queueStub, result, jobConfig;

  beforeEach(async () => {
    jobConfig = {
      jobName: 'test-name',
      processor: 'test-file.js',
      onComplete: sandbox.stub(),
      onFailed: sandbox.stub(),
      createMessage: data => ({
        data
      })
    };

    queueStub = {
      process: sandbox.stub(),
      on: sandbox.stub(),
      add: sandbox.stub()
    };

    sandbox.stub(helpers, 'createQueue').returns(queueStub);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createQueue', () => {
    experiment('when all options are specified', () => {
      beforeEach(async () => {
        result = await queueFactory.createQueue(jobConfig);
      });

      test('a queue is created with the correct name', async () => {
        expect(helpers.createQueue.calledWith(
          jobConfig.jobName
        )).to.be.true();
      });

      test('the processor is registered', async () => {
        expect(queueStub.process.calledWith(
          jobConfig.processor
        )).to.be.true();
      });

      test('the on-complete handler is registered', async () => {
        expect(queueStub.on.calledWith(
          'completed', jobConfig.onComplete
        )).to.be.true();
      });

      test('the on-failed handler is registered', async () => {
        expect(queueStub.on.calledWith(
          'failed'
        )).to.be.true();
      });

      test('when the on-fail handler is called, it is passed the queue, job and error', async () => {
        const [, func] = queueStub.on.lastCall.args;
        const err = new Error('oh no!');
        const job = { foo: 'bar' };
        func(job, err);
        expect(jobConfig.onFailed.calledWith(
          queueStub, job, err
        )).to.be.true();
      });

      test('the queue and a publish() function are returned', async () => {
        expect(result.queue).to.equal(queueStub);
        expect(result.publish).to.be.a.function();
      });
    });

    experiment('when on complete / failed handers are not specified', () => {
      beforeEach(async () => {
        delete jobConfig.onComplete;
        delete jobConfig.onFailed;
        await queueFactory.createQueue(jobConfig);
      });

      test('the handlers are not registerd', async () => {
        expect(queueStub.on.called).to.be.false();
      });
    });
  });
});
