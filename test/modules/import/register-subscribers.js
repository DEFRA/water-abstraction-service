const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const cron = require('node-cron');

const config = require('../../../config');
const registerSubscribers = require('../../../src/modules/import/register-subscribers');
const jobs = require('../../../src/modules/import/jobs');

experiment('modules/billing/register-subscribers', () => {
  let server;

  beforeEach(async () => {
    server = {
      createSubscription: sandbox.stub().resolves(),
      messageQueue: {
        publish: sandbox.stub()
      }
    };
    sandbox.stub(cron, 'schedule');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('plugin has a name', async () => {
    expect(registerSubscribers.name).to.equal('importRegisterSubscribers');
  });

  test('plugin has a register function', async () => {
    expect(registerSubscribers.register).to.be.a.function();
  });

  experiment('when the plugin is registered', async () => {
    experiment('in production', async () => {
      beforeEach(async () => {
        sandbox.stub(config, 'isProduction').value(true);
        await registerSubscribers.register(server);
      });

      test('registers s3Download job', async () => {
        expect(server.createSubscription.calledWith(
          jobs.s3Download
        )).to.be.true();
      });

      test('registers populatePendingImport job', async () => {
        expect(server.createSubscription.calledWith(
          jobs.populatePendingImport
        )).to.be.true();
      });

      test('registers importLicence job', async () => {
        expect(server.createSubscription.calledWith(
          jobs.importLicence
        )).to.be.true();
      });

      test('schedules cron job to run at 1 am daily', async () => {
        const [schedule] = cron.schedule.firstCall.args;
        expect(schedule).to.equal('0 1 * * *');
      });

      test('the cron job publishes the s3Download job', async () => {
        const [, func] = cron.schedule.firstCall.args;
        func();
        expect(server.messageQueue.publish.calledWith('import.s3-download'));
      });
    });

    experiment('in non-production', async () => {
      beforeEach(async () => {
        sandbox.stub(config, 'isProduction').value(false);
        await registerSubscribers.register(server);
      });

      test('schedules cron job to run every hour', async () => {
        const [schedule] = cron.schedule.firstCall.args;
        expect(schedule).to.equal('0 * * * *');
      });
    });
  });
});
