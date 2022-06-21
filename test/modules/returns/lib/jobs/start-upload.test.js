const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test,
  fail
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const uuid = require('uuid/v4');

const startUploadJob = require('../../../../../src/modules/returns/lib/jobs/start-upload');
const returnsUpload = require('../../../../../src/modules/returns/lib/returns-upload');
const uploadAdapters = require('../../../../../src/modules/returns/lib/upload-adapters');
const { logger } = require('../../../../../src/logger');
const eventsService = require('../../../../../src/lib/services/events');
const Event = require('../../../../../src/lib/models/event');
const errorEvent = require('../../../../../src/modules/returns/lib/jobs/error-event');

const eventId = uuid();
const companyId = uuid();

experiment('start-upload', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info').returns();
    sandbox.stub(logger, 'error').returns();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createMessage', () => {
    let message, event;

    experiment('when the upload type is CSV', () => {
      beforeEach(async () => {
        event = new Event(eventId);
        event.subtype = 'csv';
        message = startUploadJob.createMessage(event, companyId);
      });

      test('creates a message with the expected name', async () => {
        expect(message[0]).to.equal(startUploadJob.jobName);
      });

      test('the message has the expected job data', async () => {
        expect(message[1]).to.equal({
          eventId,
          companyId,
          subtype: 'csv'
        });
      });
    });

    experiment('when the upload type is XML', () => {
      beforeEach(async () => {
        event = new Event(eventId);
        event.subtype = 'xml';
        message = startUploadJob.createMessage(event, companyId);
      });

      test('creates a message with the expected name', async () => {
        expect(message[0]).to.equal(startUploadJob.jobName);
      });

      test('the message has the expected job data', async () => {
        expect(message[1]).to.equal({
          eventId,
          companyId,
          subtype: 'xml'
        });
      });
    });
  });

  experiment('handler', () => {
    let job;

    beforeEach(async () => {
      const event = new Event(eventId);
      event.fromHash({
        type: 'returns-upload',
        subtype: 'xml'
      });

      sandbox.stub(eventsService, 'findOne').resolves(event);
      sandbox.stub(eventsService, 'update').resolves(event);
      sandbox.stub(errorEvent, 'throwEventNotFoundError');

      sandbox.stub(returnsUpload, 'getReturnsS3Object').resolves({
        Body: Buffer.from('<xml></xml>', 'utf-8')
      });
      sandbox.stub(uploadAdapters.xml, 'validator').resolves({
        isValid: true
      });

      job = {
        data: {
          eventId,
          key: 'test-s3-key'
        }
      };
    });

    test('loads the event', async () => {
      await startUploadJob.handler(job);
      expect(eventsService.findOne.calledWith(job.data.eventId)).to.be.true();
    });

    test('calls throwEventNotFoundError if event is not found', async () => {
      eventsService.findOne.resolves();
      await startUploadJob.handler(job);
      expect(errorEvent.throwEventNotFoundError.calledWith(job.data.eventId)).to.be.true();
    });

    test('loads the S3 object', async () => {
      await startUploadJob.handler(job);
      const [id] = returnsUpload.getReturnsS3Object.lastCall.args;
      expect(id).to.equal(eventId);
    });

    experiment('when there is an error', () => {
      beforeEach(async () => {
        try {
          returnsUpload.getReturnsS3Object.rejects({ name: 'test-error' });
          await startUploadJob.handler(job);
          fail();
        } catch (err) {

        }
      });

      test('the error is logged', async () => {
        const params = logger.error.lastCall.args[2];
        expect(params.job).to.equal(job);
      });

      test('the status is set to error', async () => {
        const [evt] = eventsService.update.lastCall.args;
        expect(evt.status).to.equal('error');
      });

      test('the event metadata is updated', async () => {
        const [evt] = eventsService.update.lastCall.args;
        expect(evt.metadata.error.key).to.equal('server');
      });
    });

    experiment('when the xml does not validate', () => {
      beforeEach(async () => {
        uploadAdapters.xml.validator.resolves({
          isValid: false,
          validationErrors: [
            { one: 1 }
          ]
        });
        try {
          await startUploadJob.handler(job);
          fail();
        } catch (err) {

        }
      });

      test('the error is logged', async () => {
        const params = logger.error.lastCall.args[2];
        expect(params.job).to.equal(job);
      });

      test('the status is set to error', async () => {
        const [evt] = eventsService.update.lastCall.args;
        expect(evt.status).to.equal('error');
      });

      test('the event metadata is updated', async () => {
        const [evt] = eventsService.update.lastCall.args;
        expect(evt.metadata.error.key).to.equal('invalid-xml');
      });
    });
  });
});
