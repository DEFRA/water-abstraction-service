const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const startUploadJob = require('../../../../../src/modules/returns/lib/jobs/start-xml-upload');
const xmlToJsonJob = require('../../../../../src/modules/returns/lib/jobs/xml-to-json');
const { registerSubscribers } = require('../../../../../src/modules/returns/lib/jobs/init-upload');

experiment('registerSubscribers', () => {
  let messageQueue;

  beforeEach(async () => {
    sandbox.stub(xmlToJsonJob, 'publish').resolves({});
    messageQueue = {
      subscribe: sandbox.spy(),
      onComplete: sandbox.spy()
    };
    await registerSubscribers(messageQueue);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('subscribes to the start upload job', async () => {
    const { jobName, handler } = startUploadJob;
    expect(messageQueue.subscribe.calledWith(jobName, handler)).to.be.true();
  });

  test('subscribes to the XML to JSON job', async () => {
    const { jobName, handler } = xmlToJsonJob;
    expect(messageQueue.subscribe.calledWith(jobName, handler)).to.be.true();
  });

  test('when the start job finishes, the XML to JSON job is published', async () => {
    // Find the handler passed to onComplete when the job name was
    // the start upload job name.
    const [, handler] = messageQueue.onComplete.args.find(call => call[0] === startUploadJob.jobName);

    // This is the shape of the data passed to the onComplete handler.
    const job = {
      data: {
        request: {
          data: {
            eventId: 'test-event-id'
          }
        }
      }
    };

    await handler(job);
    expect(xmlToJsonJob.publish.calledWith('test-event-id')).to.be.true();
  });
});
