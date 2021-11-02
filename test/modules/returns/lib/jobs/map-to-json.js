const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test,
  fail
} = exports.lab = require('@hapi/lab').script();

const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const mapToJsonJob = require('../../../../../src/modules/returns/lib/jobs/map-to-json');
const uploadAdapters = require('../../../../../src/modules/returns/lib/upload-adapters');
const { logger } = require('../../../../../src/logger');
const s3 = require('../../../../../src/lib/services/s3');
const { usersClient } = require('../../../../../src/lib/connectors/idm');
const eventsService = require('../../../../../src/lib/services/events');
const Event = require('../../../../../src/lib/models/event');
const errorEvent = require('../../../../../src/modules/returns/lib/jobs/error-event');

const eventId = uuid();

experiment('map-to-json', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info').returns();
    sandbox.stub(logger, 'error').returns();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createMessage', () => {
    let message;

    beforeEach(async () => {
      message = mapToJsonJob.createMessage({ eventId });
    });

    test('creates a message with the expected name', async () => {
      expect(message[0]).to.equal(mapToJsonJob.jobName);
    });

    test('the message has the expected job data', async () => {
      expect(message[1]).to.equal({
        eventId,
        subtype: 'csv'
      });
    });
  });

  experiment('handler', () => {
    let job, event;

    beforeEach(async () => {
      event = new Event();
      event.fromHash({
        id: eventId,
        issuer: 'test-job@example.com',
        subtype: 'xml'
      });

      sandbox.stub(eventsService, 'findOne').resolves(event);
      sandbox.stub(eventsService, 'update').resolves(event);
      sandbox.stub(eventsService, 'updateStatus').resolves(event);
      sandbox.stub(errorEvent, 'throwEventNotFoundError');

      const str = fs.readFileSync(path.join(__dirname, '../xml-files-for-tests/weekly-return-pass.xml'));

      sandbox.stub(usersClient, 'getUserByUsername').resolves({
        user_id: 123,
        user_name: 'test-job@example.com',
        external_id: '1234-abcd'
      });

      sandbox.stub(uploadAdapters.xml, 'mapper').resolves('{}');

      sandbox.stub(s3, 'getObject').resolves({ Body: Buffer.from(str, 'utf-8') });
      sandbox.stub(s3, 'upload').resolves({});

      job = {
        data: {
          eventId: 'test-event-id'
        },
        done: sinon.spy()
      };
    });

    test('loads the event', async () => {
      await mapToJsonJob.handler(job);
      expect(eventsService.findOne.calledWith(job.data.eventId)).to.be.true();
    });

    test('calls throwEventNotFoundError if event is not found', async () => {
      eventsService.findOne.resolves();
      await mapToJsonJob.handler(job);
      expect(errorEvent.throwEventNotFoundError.calledWith(job.data.eventId)).to.be.true();
    });

    test('loads the S3 object', async () => {
      await mapToJsonJob.handler(job);
      const [s3Key] = s3.getObject.lastCall.args;
      expect(s3Key).to.equal(`returns-upload/${eventId}.xml`);
    });

    test('gets the user object for the issuer', async () => {
      await mapToJsonJob.handler(job);
      const [userName] = usersClient.getUserByUsername.lastCall.args;
      expect(userName).to.equal('test-job@example.com');
    });

    test('maps the JSON to the required shape', async () => {
      await mapToJsonJob.handler(job);
      const [, user] = uploadAdapters.xml.mapper.lastCall.args;
      expect(user.user_id).to.equal(123);
    });

    test('uploads JSON back to S3', async () => {
      await mapToJsonJob.handler(job);
      const [fileName, buffer] = s3.upload.lastCall.args;
      expect(fileName).to.equal(`returns-upload/${eventId}.json`);
      expect(buffer).to.be.a.buffer();
    });

    test('updates the event status to validated', async () => {
      await mapToJsonJob.handler(job);
      const [id, status] = eventsService.updateStatus.lastCall.args;
      expect(id).to.equal(eventId);
      expect(status).to.equal('validated');
    });

    experiment('when the user is not found', () => {
      beforeEach(async () => {
        try {
          usersClient.getUserByUsername.resolves();
          await mapToJsonJob.handler(job);
          fail();
        } catch (err) {

        }
      });

      test('the error is logged', async () => {
        const params = logger.error.lastCall.args[2];
        expect(params.job).to.equal(job);
      });

      test('the status is set to error', async () => {
        const [ev] = eventsService.update.lastCall.args;
        expect(ev.id).to.equal(eventId);
        expect(ev.status).to.equal('error');
      });

      test('the event metadata is updated', async () => {
        const [ev] = eventsService.update.lastCall.args;
        expect(ev.metadata.error.key).to.equal('user-not-found');
      });
    });

    experiment('when the XML cannot be mapped to JSON', () => {
      beforeEach(async () => {
        try {
          uploadAdapters.xml.mapper.throws();
          await mapToJsonJob.handler(job);
          fail();
        } catch (err) {

        }
      });

      test('the error is logged', async () => {
        const params = logger.error.lastCall.args[2];
        expect(params.job).to.equal(job);
      });

      test('the status is set to error', async () => {
        const [ev] = eventsService.update.lastCall.args;
        expect(ev.status).to.equal('error');
      });

      test('the event metadata is updated', async () => {
        const [ev] = eventsService.update.lastCall.args;
        expect(ev.metadata.error.key).to.equal('xml-to-json-mapping-failure');
      });
    });

    experiment('when there is an error', () => {
      beforeEach(async () => {
        try {
          s3.getObject.rejects({ name: 'test-error' });
          await mapToJsonJob.handler(job);
          fail();
        } catch (err) {

        }
      });

      test('the error is logged', async () => {
        const params = logger.error.lastCall.args[2];
        expect(params.job).to.equal(job);
      });

      test('the status is set to error', async () => {
        const [ev] = eventsService.update.lastCall.args;
        expect(ev.status).to.equal('error');
      });

      test('the event comment is updated', async () => {
        const [ev] = eventsService.update.lastCall.args;
        expect(ev.metadata.error.key).to.equal('server');
      });
    });
  });
});
