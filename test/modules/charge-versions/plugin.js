'use strict';

const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const cron = require('node-cron');
const { plugin } = require('../../../src/modules/charge-versions/plugin');
const licenceVersions = require('../../../src/lib/connectors/repos/licence-versions');
const createChargeVersionWorkflows = require('../../../src/modules/charge-versions/jobs/create-charge-version-workflows');
const { expect } = require('@hapi/code');

experiment('modules/charge-versions/plugin.js', () => {
  let server;

  beforeEach(async () => {
    server = {
      queueManager: {
        add: sandbox.stub().resolves(),
        register: sandbox.stub().resolves()
      }
    };
    sandbox.stub(cron, 'schedule');
    sandbox.stub(licenceVersions, 'findIdsByDateNotInChargeVersionWorkflows').returns([]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('has a plugin name', async () => {
    expect(plugin.name).to.equal('charge-version-workflow-jobs');
  });

  test('requires hapiBull plugin', async () => {
    expect(plugin.dependencies).to.equal(['hapiBull']);
  });

  experiment('register', () => {
    experiment('on target environments', () => {
      beforeEach(async () => {
        sandbox.stub(process, 'env').value({
          NODE_ENV: 'test'
        });
        await plugin.register(server);
      });

      test('adds subscriber for the charge charge version workflow job', async () => {
        const [job] = server.queueManager.register.firstCall.args;
        expect(job).to.equal(createChargeVersionWorkflows);
      });

      test('schedules a cron job to run every 6 hours', async () => {
        expect(cron.schedule.calledWith(
          '0 */6 * * *'
        )).to.be.true();
      });
    });
  });
});
