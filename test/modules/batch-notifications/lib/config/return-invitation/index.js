const { expect } = require('code');
const {
  beforeEach,
  experiment,
  test,
  afterEach
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const Joi = require('joi');

const config = require('../../../../../../src/modules/batch-notifications/config/return-invitation');
const returnsConnector = require('../../../../../../src/lib/connectors/returns');
const permitConnector = require('../../../../../../src/lib/connectors/permit');
const scheduledNotifications = require('../../../../../../src/controllers/notifications');
const eventHelpers = require('../../../../../../src/modules/batch-notifications/lib/event-helpers');
const { MESSAGE_STATUS_DRAFT } = require('../../../../../../src/modules/batch-notifications/lib/message-statuses');

const { getWaterLicence } = require('../../../../../responses/permits/licence');

experiment('return invitation config', () => {
  test('has the correct prefix', async () => {
    expect(config.prefix).to.equal('RINV-');
  });

  test('has the correct name', async () => {
    expect(config.name).to.equal('Returns: invitation');
  });

  test('has the correct message type', async () => {
    expect(config.messageType).to.equal('returnInvitation');
  });

  experiment('schema', () => {
    test('can be an empty object', async () => {
      const { error } = Joi.validate({}, config.schema);
      expect(error).to.equal(null);
    });

    test('can contain an array of licence numbers to exclude from the notification', async () => {
      const { error } = Joi.validate({
        excludeLicences: ['01/123', '04/567']
      }, config.schema);
      expect(error).to.equal(null);
    });
  });

  experiment('getRecipients', () => {
    const jobData = {
      ev: {
        eventId: 'event_1',
        metadata: {
          options: {
            excludeLicences: ['01/123']
          }
        }
      }
    };

    const returns = [{
      licence_ref: '01/123'
    }, {
      licence_ref: '02/345'
    }];

    beforeEach(async () => {
      sandbox.stub(returnsConnector, 'getCurrentDueReturns').resolves(returns);
      sandbox.stub(permitConnector.licences, 'getWaterLicence').resolves(getWaterLicence());
      sandbox.stub(scheduledNotifications.repository, 'create').resolves();
      sandbox.stub(eventHelpers, 'markAsProcessed');
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('finds current due returns excluding any specified licence numbers', async () => {
      await config.getRecipients(jobData);
      expect(returnsConnector.getCurrentDueReturns.callCount).to.equal(1);
      const [ excluded ] = returnsConnector.getCurrentDueReturns.lastCall.args;
      expect(excluded).to.equal(['01/123']);
    });

    test('schedules a message for each de-duped contact', async () => {
      await config.getRecipients(jobData);
      expect(scheduledNotifications.repository.create.callCount).to.equal(1);

      const [row] = scheduledNotifications.repository.create.lastCall.args;

      expect(row.recipient).to.equal('n/a');
      expect(row.message_type).to.equal('letter');
      expect(row.message_ref).to.equal('returns_invitation_letter');
      // expect(row.personalisation).to.equal({'postcode': 'TT1 1TT', 'address_line_1': 'Mr H Doe', 'address_line_2': 'Daisy cow farm', 'address_line_3': 'Long road', 'address_line_4': 'Daisybury', 'address_line_5': 'Testingshire', 'date': null, 'startDate': '1 April 2019', 'endDate': '31 March 2020'});
      expect(JSON.parse(row.personalisation)).to.equal({
        'postcode': 'TT1 1TT',
        'address_line_1': 'Mr H Doe',
        'address_line_2': 'Daisy cow farm',
        'address_line_3': 'Long road',
        'address_line_4': 'Daisybury',
        'address_line_5': 'Testingshire',
        'date': null,
        'startDate': '1 April 2019',
        'endDate': '31 March 2020'
      });
      expect(row.status).to.equal(MESSAGE_STATUS_DRAFT);
      expect(row.licences).to.equal('["01/123","02/345"]');
      expect(row.event_id).to.equal('event_1');
      expect(row.metadata).to.equal('{}');
    });

    test('updates event with licences affected and recipient count', async () => {
      await config.getRecipients(jobData);
      expect(eventHelpers.markAsProcessed.callCount).to.equal(1);
      const [eventId, licenceNumbers, count] = eventHelpers.markAsProcessed.lastCall.args;
      expect(eventId).to.equal('event_1');
      expect(licenceNumbers).to.equal(['01/123', '02/345']);
      expect(count).to.equal(1);
    });
  });
});
