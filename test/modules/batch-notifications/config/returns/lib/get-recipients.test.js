const { expect } = require('@hapi/code');
const {
  beforeEach,
  experiment,
  test,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const { logger } = require('../../../../../../src/logger');
const Contact = require('../../../../../../src/lib/models/contact');
const notificationContacts =
  require('../../../../../../src/modules/batch-notifications/config/returns/lib/return-notification-contacts');
const notificationRecipients =
  require('../../../../../../src/modules/batch-notifications/config/returns/lib/return-notification-recipients');
const { getRecipients } =
  require('../../../../../../src/modules/batch-notifications/config/returns/lib/get-recipients');
const scheduledNotifications =
  require('../../../../../../src/controllers/notifications');
const eventHelpers =
  require('../../../../../../src/modules/batch-notifications/lib/event-helpers');

experiment('getRecipients', () => {
  const jobData = {
    ev: {
      id: 'event_1',
      subtype: 'returnInvitation',
      metadata: {
        name: 'Returns: invitation',
        options: {
          excludeLicences: ['01/123']
        },
        returnCycle: {
          startDate: '2019-04-01',
          endDate: '2020-03-31',
          dueDate: '2020-04-28',
          isSummer: false
        }
      }
    }
  };

  beforeEach(async () => {
    sandbox.stub(notificationContacts, 'getReturnContacts');
    sandbox.stub(notificationRecipients, 'getRecipientList').returns([
      {
        contact: new Contact({
          email: 'john@example.com',
          firstName: 'John',
          name: 'Doe',
          type: Contact.CONTACT_TYPE_PERSON,
          role: Contact.CONTACT_ROLE_PRIMARY_USER
        }),
        licenceNumbers: ['01/123'],
        returnIds: ['1:01/123:12345:2018-01-01:2019-01-01']
      }
    ]);

    sandbox.stub(scheduledNotifications.repository, 'create').resolves();
    sandbox.stub(eventHelpers, 'markAsProcessed');
    sandbox.stub(logger, 'error').returns();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('finds due returns and contacts excluding any specified licence numbers', async () => {
    await getRecipients(jobData);
    expect(notificationContacts.getReturnContacts.callCount).to.equal(1);
    const [excluded] = notificationContacts.getReturnContacts.lastCall.args;
    expect(excluded).to.equal(['01/123']);
  });

  test('maps and de-duplicates recipient list', async () => {
    await getRecipients(jobData);
    expect(notificationRecipients.getRecipientList.callCount).to.equal(1);
  });

  test('schedules a message for each de-duped contact', async () => {
    await getRecipients(jobData);
    expect(scheduledNotifications.repository.create.callCount).to.equal(1);

    const [row] = scheduledNotifications.repository.create.lastCall.args;

    expect(Object.keys(row)).to.only.include([
      'message_ref',
      'id',
      'event_id',
      'licences',
      'metadata',
      'status',
      'message_type',
      'recipient',
      'personalisation']
    );
  });

  test('updates event with licences affected and recipient count', async () => {
    await getRecipients(jobData);
    expect(eventHelpers.markAsProcessed.callCount).to.equal(1);
    const [eventId, licenceNumbers, count] = eventHelpers.markAsProcessed.lastCall.args;
    expect(eventId).to.equal('event_1');
    expect(licenceNumbers).to.equal(['01/123']);
    expect(count).to.equal(1);
  });

  test('logs an error relating to the notification type if contact not found', async () => {
    notificationRecipients.getRecipientList.returns([
      {
        licenceNumbers: ['01/123'],
        returnIds: ['1:01/123:12345:2018-01-01:2019-01-01']
      }
    ]);
    await getRecipients(jobData);
    expect(logger.error.callCount).to.equal(1);
    expect(logger.error.calledWith(
      'Returns: invitation - no contact found for 1:01/123:12345:2018-01-01:2019-01-01'
    )).to.be.true();
  });
});
