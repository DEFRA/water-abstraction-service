const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const sandbox = require('sinon').createSandbox();

const eventsService = require('../../../../../src/lib/services/events');
const Event = require('../../../../../src/lib/models/event');
const { logger } = require('../../../../../src/logger');
const onComplete = require('../../../../../src/modules/returns/lib/jobs/on-complete');

const eventId = uuid();

experiment('modules/returns/lib/jobs/on-complete', () => {
  let job, messageQueue;

  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');
    messageQueue = {
      publish: sandbox.stub()
    };
    const event = new Event(eventId);
    sandbox.stub(eventsService, 'findOne').resolves(event);
    sandbox.stub(eventsService, 'update');
  });
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.handler', () => {
    experiment('when the job completed OK', () => {
      beforeEach(async () => {
        job = {
          data: {
            failed: false,
            request: {
              name: 'test-name'
            }
          }
        };
        await onComplete(job, messageQueue);
      });

      test('a message is logged', async () => {
        expect(logger.info.calledWith(
          'handling onComplete test-name'
        )).to.be.true();
      });

      test('no other jobs are published', async () => {
        expect(messageQueue.publish.called).to.be.false();
      });
    });

    experiment('when the job completed OK and there is subsequent job', () => {
      beforeEach(async () => {
        job = {
          data: {
            failed: false,
            request: {
              name: 'test-name',
              data: { foo: 'bar' }
            }
          }
        };
        const nextJob = {
          createMessage: data => ({
            name: 'next-job',
            data
          })
        };
        await onComplete(job, messageQueue, nextJob);
      });

      test('a message is logged', async () => {
        expect(logger.info.calledWith(
          'handling onComplete test-name'
        )).to.be.true();
      });

      test('the next job is published with the same data', async () => {
        const [message] = messageQueue.publish.lastCall.args;
        expect(message.name).to.equal('next-job');
        expect(message.data).to.equal(job.data.request.data);
      });
    });

    experiment('when the job failed', () => {
      beforeEach(async () => {
        job = {
          data: {
            failed: true,
            request: {
              name: 'test-name',
              data: {
                eventId
              }
            }
          }
        };
        await onComplete(job, messageQueue);
      });

      test('an error is logged', async () => {
        const [msg, err, data] = logger.error.lastCall.args;
        expect(msg).to.equal('test-name job failed');
        expect(err).to.be.an.error();
        expect(data).to.equal({
          name: 'test-name',
          eventId
        });
      });

      test('the event is loaded', async () => {
        expect(eventsService.findOne.calledWith(eventId)).to.be.true();
      });

      test('the event is updated to error status', async () => {
        const [ev] = eventsService.update.lastCall.args;
        expect(ev.id).to.equal(eventId);
        expect(ev.status).to.equal('error');
        expect(ev.metadata.error.message).to.equal('test-name job failed');
        expect(ev.metadata.error.key).to.equal('server');
      });
    });
  });
})
;
