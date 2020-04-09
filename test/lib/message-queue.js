const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const { createSubscription } = require('../../src/lib/message-queue');

experiment('lib/message-queue', () => {
  let messageQueue;

  beforeEach(async () => {
    messageQueue = {
      subscribe: sandbox.stub(),
      onComplete: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createSubscription', () => {
    let jobContainer;

    experiment('when there is no onComplete or custom options', () => {
      beforeEach(async () => {
        jobContainer = {
          job: {
            jobName: 'test-name',
            handler: () => {},
            createMessage: () => {}
          }
        };
        await createSubscription(messageQueue, jobContainer);
      });

      test('the subscription is created', async () => {
        const [jobName, options, handler] = messageQueue.subscribe.lastCall.args;
        expect(jobName).to.equal(jobContainer.job.jobName);
        expect(options).to.equal({});
        expect(handler).to.equal(jobContainer.job.handler);
      });

      test('onComplete is not called', async () => {
        expect(messageQueue.onComplete.called).to.be.false();
      });
    });

    experiment('when there is are custom options', () => {
      beforeEach(async () => {
        jobContainer = {
          job: {
            jobName: 'test-name',
            handler: () => {},
            createMessage: () => {},
            options: { foo: 'bar' }
          }
        };
        await createSubscription(messageQueue, jobContainer);
      });

      test('the subscription is created', async () => {
        const [jobName, options, handler] = messageQueue.subscribe.lastCall.args;
        expect(jobName).to.equal(jobContainer.job.jobName);
        expect(options).to.equal({ foo: 'bar' });
        expect(handler).to.equal(jobContainer.job.handler);
      });

      test('onComplete is not called', async () => {
        expect(messageQueue.onComplete.called).to.be.false();
      });
    });

    experiment('when there is an onComplete handler', () => {
      beforeEach(async () => {
        jobContainer = {
          job: {
            jobName: 'test-name',
            handler: () => {},
            createMessage: () => {},
            options: { }
          },
          onCompleteHandler: sandbox.stub()
        };
        await createSubscription(messageQueue, jobContainer);
      });

      test('the subscription is created', async () => {
        const [jobName, options, handler] = messageQueue.subscribe.lastCall.args;
        expect(jobName).to.equal(jobContainer.job.jobName);
        expect(options).to.equal({});
        expect(handler).to.equal(jobContainer.job.handler);
      });

      test('onComplete handler is registered', async () => {
        const [jobName, handler] = messageQueue.onComplete.lastCall.args;
        expect(jobName).to.equal(jobContainer.job.jobName);
        expect(handler).to.be.a.function();
      });

      test('the onComplete handler is called with the messageQueue', async () => {
        const [, handler] = messageQueue.onComplete.lastCall.args;
        handler({ foo: 'bar' });
        expect(jobContainer.onCompleteHandler.calledWith(
          { foo: 'bar' }, messageQueue
        )).to.be.true();
      });
    });

    experiment('when the job container is invalid', () => {
      beforeEach(async () => {
        jobContainer = {
          job: {
            jobName: 'test-name',
            handler: 'oops',
            createMessage: () => {},
            options: { }
          },
          onCompleteHandler: sandbox.stub()
        };
      });

      test('an error is thrown', async () => {
        const func = () => createSubscription(messageQueue, jobContainer);
        expect(func()).to.reject();
      });
    });
  });
});
