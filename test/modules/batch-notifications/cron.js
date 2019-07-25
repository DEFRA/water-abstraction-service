const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const cron = require('node-cron');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const batchProcessors =
  require('../../../src/modules/batch-notifications/lib/batch-processors');
const { scheduleJobs } =
  require('../../../src/modules/batch-notifications/cron');

experiment('batch notifications cron', () => {
  beforeEach(async () => {
    sandbox.stub(cron, 'schedule');
    scheduleJobs();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('schedules event refresh every minute', async () => {
    const [schedule, handler] = cron.schedule.getCall(0).args;
    expect(schedule).to.equal('* * * * *');
    expect(handler).to.equal(batchProcessors.refreshEvents);
  });

  test('schedules sending message batch every 15 seconds', async () => {
    const [schedule, handler] = cron.schedule.getCall(1).args;
    expect(schedule).to.equal('0/15 * * * * *');
    expect(handler).to.equal(batchProcessors.sendMessageBatch);
  });

  test('schedules check notify status batch every 15 seconds', async () => {
    const [schedule, handler] = cron.schedule.getCall(2).args;
    expect(schedule).to.equal('0/15 * * * * *');
    expect(handler).to.equal(batchProcessors.checkNotifyStatuses);
  });
});
