const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const registerSubscribers = require('../../../src/modules/billing/register-subscribers');
const jobs = require('../../../src/modules/billing/jobs');

experiment('modules/billing/register-subscribers', () => {
  let server;

  const getOnCompleteHandlerForJobName = jobName => {
    const onCompleteCall = server.messageQueue.onComplete.getCalls().find(call => {
      return call.args[0] === jobName;
    });

    return onCompleteCall.args[1];
  };

  beforeEach(async () => {
    server = {
      messageQueue: {
        subscribe: sandbox.stub().resolves(),
        onComplete: sandbox.stub().resolves()
      }
    };

    sandbox.stub(jobs.populateBatchChargeVersions, 'onCompleteHandler').resolves();
    sandbox.stub(jobs.processChargeVersion, 'onCompleteHandler').resolves();
    sandbox.stub(jobs.prepareTransactions, 'onCompleteHandler').resolves();
    sandbox.stub(jobs.createCharge, 'onCompleteHandler').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('plugin has a name', async () => {
    expect(registerSubscribers.name).to.equal('billingRegisterSubscribers');
  });

  test('plugin has a register function', async () => {
    expect(registerSubscribers.register).to.be.a.function();
  });

  experiment('when the plugin is registered with the server', async () => {
    beforeEach(async () => {
      await registerSubscribers.register(server);
    });

    experiment('for the populateBatchChargeVersions job', () => {
      test('a subscribe handler is registered', async () => {
        const { job } = jobs.populateBatchChargeVersions;
        expect(server.messageQueue.subscribe.calledWith(job.jobName, job.handler)).to.be.true();
      });

      test('an onComplete handler is registered', async () => {
        const { job } = jobs.populateBatchChargeVersions;
        expect(server.messageQueue.onComplete.calledWith(job.jobName)).to.be.true();
      });

      test('on execution, the onComplete is passed a job and the message queue', async () => {
        const { job, onCompleteHandler } = jobs.populateBatchChargeVersions;
        const pgBossOnCompleteHandler = getOnCompleteHandlerForJobName(job.jobName);

        const testJob = { id: 'test-job' };
        await pgBossOnCompleteHandler(testJob);

        expect(onCompleteHandler.calledWith(testJob, server.messageQueue)).to.be.true();
      });
    });

    experiment('for the processChargeVersion job', () => {
      test('a subscribe handler is registered for processChargeVersion', async () => {
        const { job } = jobs.processChargeVersion;
        expect(server.messageQueue.subscribe.calledWith(job.jobName, job.handler)).to.be.true();
      });

      test('an onComplete handler is registered for processChargeVersion', async () => {
        const { job } = jobs.processChargeVersion;
        expect(server.messageQueue.onComplete.calledWith(job.jobName)).to.be.true();
      });

      test('on execution, the onComplete is passed a job and the message queue', async () => {
        const { job, onCompleteHandler } = jobs.processChargeVersion;
        const pgBossOnCompleteHandler = getOnCompleteHandlerForJobName(job.jobName);

        const testJob = { id: 'test-job' };
        await pgBossOnCompleteHandler(testJob);

        expect(onCompleteHandler.calledWith(testJob, server.messageQueue)).to.be.true();
      });
    });

    experiment('for the prepareTransactions job', () => {
      test('a subscribe handler is registered', async () => {
        const { job } = jobs.prepareTransactions;
        expect(server.messageQueue.subscribe.calledWith(job.jobName, job.handler)).to.be.true();
      });

      test('an onComplete handler is registered', async () => {
        const { job } = jobs.prepareTransactions;
        expect(server.messageQueue.onComplete.calledWith(job.jobName)).to.be.true();
      });

      test('on execution, the onComplete is passed a job and the message queue', async () => {
        const { job, onCompleteHandler } = jobs.prepareTransactions;
        const pgBossOnCompleteHandler = getOnCompleteHandlerForJobName(job.jobName);

        const testJob = { id: 'test-job' };
        await pgBossOnCompleteHandler(testJob);

        expect(onCompleteHandler.calledWith(testJob, server.messageQueue)).to.be.true();
      });
    });

    experiment('for the createCharge job', () => {
      test('a subscribe handler is registered', async () => {
        const { job } = jobs.createCharge;
        expect(server.messageQueue.subscribe.calledWith(job.jobName, job.handler)).to.be.true();
      });

      test('an onComplete handler is registered', async () => {
        const { job } = jobs.createCharge;
        expect(server.messageQueue.onComplete.calledWith(job.jobName)).to.be.true();
      });

      test('on execution, the onComplete is passed a job and the message queue', async () => {
        const { job, onCompleteHandler } = jobs.createCharge;
        const pgBossOnCompleteHandler = getOnCompleteHandlerForJobName(job.jobName);

        const testJob = { id: 'test-job' };
        await pgBossOnCompleteHandler(testJob);

        expect(onCompleteHandler.calledWith(testJob, server.messageQueue)).to.be.true();
      });
    });
  });
});
