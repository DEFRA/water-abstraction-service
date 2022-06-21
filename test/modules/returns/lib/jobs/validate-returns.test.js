const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const validateReturnsJob = require('../../../../../src/modules/returns/lib/jobs/validate-returns');
const uploadValidator = require('../../../../../src/modules/returns/lib/returns-upload-validator');
const returnsUpload = require('../../../../../src/modules/returns/lib/returns-upload');
const { logger } = require('../../../../../src/logger');
const eventsService = require('../../../../../src/lib/services/events');
const Event = require('../../../../../src/lib/models/event');
const errorEvent = require('../../../../../src/modules/returns/lib/jobs/error-event');
const s3 = require('../../../../../src/lib/services/s3');

const eventId = uuid();

experiment('validate-returns', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info').returns();
    sandbox.stub(s3, 'upload').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });
  experiment('.createMessage', () => {
    let message;

    beforeEach(async () => {
      message = validateReturnsJob.createMessage({ eventId });
    });

    test('creates a message with the expected name', async () => {
      expect(message[0]).to.equal(validateReturnsJob.jobName);
    });

    test('the message has the expected job data', async () => {
      expect(message[1]).to.equal({
        eventId,
        subtype: 'csv'
      });
    });
  });

  experiment('handler', () => {
    let job, event, jsonData, returnData;

    beforeEach(async () => {
      event = new Event();
      event.fromHash({
        id: eventId,
        issuer: 'test-job@example.com',
        subtype: 'xml'
      });

      jsonData = [
        { returnId: 'test-return-1', returnRequirement: '11111111' },
        { returnId: 'test-return-2', returnRequirement: '22222222' }
      ];

      returnData = {
        returnId: 'test-return-id',
        licenceNumber: '12/34/56',
        isNil: true,
        errors: []
      };

      sandbox.stub(eventsService, 'findOne').resolves(event);
      sandbox.stub(eventsService, 'update').resolves(event);
      sandbox.stub(errorEvent, 'throwEventNotFoundError');

      sandbox.stub(returnsUpload, 'getReturnsS3Object').resolves({
        Body: JSON.stringify(jsonData)
      });
      sandbox.stub(uploadValidator, 'validate').resolves([returnData]);

      job = {
        data: {
          eventId: 'test-event-id',
          companyId: 'test-company-id'
        }
      };
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('loads the event', async () => {
      await validateReturnsJob.handler(job);
      expect(eventsService.findOne.calledWith(job.data.eventId)).to.be.true();
    });

    test('calls throwEventNotFoundError if event is not found', async () => {
      eventsService.findOne.resolves();
      await validateReturnsJob.handler(job);
      expect(errorEvent.throwEventNotFoundError.calledWith(job.data.eventId)).to.be.true();
    });

    test('loads the S3 object', async () => {
      await validateReturnsJob.handler(job);
      const [eventId, type] = returnsUpload.getReturnsS3Object.lastCall.args;
      expect(eventId).to.equal('test-event-id');
      expect(type).to.equal('json');
    });

    test('validates the returns data', async () => {
      await validateReturnsJob.handler(job);
      const [data, companyId] = uploadValidator.validate.lastCall.args;
      expect(data).to.equal(jsonData);
      expect(companyId).to.equal(job.data.companyId);
    });

    test('updates the event status to ready', async () => {
      await validateReturnsJob.handler(job);
      const [event] = eventsService.update.lastCall.args;
      expect(event.status).to.equal('ready');
    });

    test('updates the event metadata with validationResults', async () => {
      await validateReturnsJob.handler(job);
      const [event] = eventsService.update.lastCall.args;

      const { returnId, licenceNumber, isNil, errors, totalVolume } = event.metadata.validationResults[0];
      expect(returnId).to.equal(returnData.returnId);
      expect(licenceNumber).to.equal(returnData.licenceNumber);
      expect(isNil).to.equal(returnData.isNil);
      expect(errors).to.equal(returnData.errors);
      expect(totalVolume).to.be.null();
    });
  });
});
