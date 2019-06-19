const Lab = require('lab');

const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();

// Connectors
const notify = require('../../../../src/controllers/tasks/lib/notify');

experiment('scheduleRenewalEmails notify connector', () => {
  beforeEach(async () => {
    sandbox.stub(notify._notify, 'enqueue').resolves();
  });

  afterEach(async () => {
    sandbox.reset();
  });

  test('calls the enqueue method with the supplied config object', async () => {
    await notify.sendMessage({ foo: 'bar' });
    const [ config ] = notify._notify.enqueue.lastCall.args;
    expect(config).to.equal({ foo: 'bar' });
  });
});
