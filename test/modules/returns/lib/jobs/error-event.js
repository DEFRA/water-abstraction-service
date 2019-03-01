const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const event = require('../../../../../src/lib/event');
const errorEvent = require('../../../../../src/modules/returns/lib/jobs/error-event');

experiment('setEventError', () => {
  beforeEach(async () => {
    sandbox.stub(event, 'save').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('saves the event', async () => {
    const error = new Error('error-message');
    const evt = {};

    await errorEvent.setEventError(evt, error);

    expect(event.save.called).to.be.true();
  });

  test('sets the event status to error', async () => {
    const error = new Error('error-message');
    await errorEvent.setEventError({}, error);

    const [evt] = event.save.lastCall.args;
    expect(evt.status).to.equal('error');
  });

  test('sets the key to "server" by default', async () => {
    const error = new Error('error-message');

    await errorEvent.setEventError({}, error);

    const [evt] = event.save.lastCall.args;
    expect(evt.metadata.error.key).to.equal('server');
  });

  test('sets the error message', async () => {
    const error = new Error('error-message');

    await errorEvent.setEventError({}, error);

    const [evt] = event.save.lastCall.args;
    expect(evt.metadata.error.message).to.equal('error-message');
  });

  test('sets the key to the error key if passed', async () => {
    const error = new Error('error-message');
    error.key = 'error-key';

    await errorEvent.setEventError({}, error);

    const [evt] = event.save.lastCall.args;
    expect(evt.metadata.error.key).to.equal('error-key');
  });

  test('does not replace any existing metadata', async () => {
    const error = new Error('error-message');

    const evt = {
      metadata: { date: { day: 'Thursday' } }
    };

    await errorEvent.setEventError(evt, error);

    const [savedEvent] = event.save.lastCall.args;
    expect(savedEvent.metadata).to.equal({
      date: { day: 'Thursday' },
      error: { key: 'server', message: 'error-message' }
    });
  });
});
