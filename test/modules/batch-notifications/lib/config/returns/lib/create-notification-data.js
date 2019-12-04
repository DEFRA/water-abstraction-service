const { expect } = require('@hapi/code');
const {
  beforeEach,
  experiment,
  test,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const createNotificationData = require('../../../../../../../src/modules/batch-notifications/config/returns/lib/create-notification-data');
const Contact = require('../../../../../../../src/lib/models/contact');
const { MESSAGE_STATUS_DRAFT } = require('../../../../../../../src/modules/batch-notifications/lib/message-statuses');

experiment('modules/batch-notifications/config/return-invitation/create-notification-data', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('_getReturnPersonalisation', () => {
    test('gets return cycle personalisation fields', async () => {
      const result = createNotificationData._getReturnPersonalisation('2019-05-01');
      expect(result).to.equal({
        periodStartDate: '1 April 2018',
        periodEndDate: '31 March 2019',
        returnDueDate: '28 April 2019'
      });
    });
  });

  experiment('getNotificationData', () => {
    let ev, context, result;

    const createContact = role => new Contact({
      role,
      email: 'mail@example.com',
      addressLine1: 'Daisy Farm',
      addressLine2: 'Buttercup lane',
      addressLine3: 'Shrew hill',
      addressLine4: 'Mouse corner',
      town: 'Testing',
      county: 'Testingshire',
      country: 'England',
      postcode: 'TT1 1TT',
      name: 'Doe',
      firstName: 'John',
      salutation: 'Sir',
      initials: 'J',
      type: Contact.CONTACT_TYPE_PERSON
    });

    beforeEach(async () => {
      ev = {
        eventId: 'event_1',
        subtype: 'returnInvitation'
      };

      context = {
        licenceNumbers: ['licence_1', 'licence_2'],
        returnIds: ['return_1', 'return_2']
      };
    });

    experiment('when the contact has "licence holder" role', () => {
      beforeEach(async () => {
        const contact = createContact(Contact.CONTACT_ROLE_LICENCE_HOLDER);
        result = createNotificationData.createNotificationData(ev, contact, context);
      });

      test('the message has an ID', async () => {
        expect(result.id).to.be.a.string().length(36);
      });

      test('the message references the event', async () => {
        expect(result.event_id).to.equal(ev.eventId);
      });

      test('the message references the licences and returns', async () => {
        expect(result.licences).to.equal(context.licenceNumbers);
        expect(result.metadata.returnIds).to.equal(context.returnIds);
      });

      test('the message status is draft', async () => {
        expect(result.status).to.equal(MESSAGE_STATUS_DRAFT);
      });

      test('the correct message type is used', async () => {
        expect(result.message_type).to.equal('letter');
        expect(result.recipient).to.equal('n/a');
        expect(result.message_ref).to.equal('returns_invitation_licence_holder_letter');
      });

      test('contains the correct personalisation fields', async () => {
        expect(Object.keys(result.personalisation)).only.include(
          ['periodStartDate',
            'periodEndDate',
            'returnDueDate',
            'name',
            'postcode',
            'address_line_1',
            'address_line_2',
            'address_line_3',
            'address_line_4',
            'address_line_5',
            'address_line_6']
        );
      });
    });

    experiment('when the contact has "returns to" role', () => {
      beforeEach(async () => {
        const contact = createContact(Contact.CONTACT_ROLE_RETURNS_TO);
        result = createNotificationData.createNotificationData(ev, contact, context);
      });

      test('the correct message type is used', async () => {
        expect(result.message_type).to.equal('letter');
        expect(result.recipient).to.equal('n/a');
        expect(result.message_ref).to.equal('returns_invitation_returns_to_letter');
      });

      test('contains the correct personalisation fields', async () => {
        expect(Object.keys(result.personalisation)).only.include(
          ['periodStartDate',
            'periodEndDate',
            'returnDueDate',
            'name',
            'postcode',
            'address_line_1',
            'address_line_2',
            'address_line_3',
            'address_line_4',
            'address_line_5',
            'address_line_6']
        );
      });
    });

    experiment('when the contact has "primary user" role', () => {
      beforeEach(async () => {
        const contact = createContact(Contact.CONTACT_ROLE_PRIMARY_USER);
        result = createNotificationData.createNotificationData(ev, contact, context);
      });

      test('the correct message type is used', async () => {
        expect(result.message_type).to.equal('email');
        expect(result.recipient).to.equal('mail@example.com');
        expect(result.message_ref).to.equal('returns_invitation_primary_user_email');
      });

      test('contains the correct personalisation fields', async () => {
        expect(Object.keys(result.personalisation)).only.include(
          ['periodStartDate',
            'periodEndDate',
            'returnDueDate']
        );
      });
    });

    experiment('when the contact has "returns agent" role', () => {
      beforeEach(async () => {
        const contact = createContact(Contact.CONTACT_ROLE_RETURNS_AGENT);
        result = createNotificationData.createNotificationData(ev, contact, context);
      });

      test('the correct message type is used', async () => {
        expect(result.message_type).to.equal('email');
        expect(result.recipient).to.equal('mail@example.com');
        expect(result.message_ref).to.equal('returns_invitation_returns_agent_email');
      });

      test('contains the correct personalisation fields', async () => {
        expect(Object.keys(result.personalisation)).only.include(
          ['periodStartDate',
            'periodEndDate',
            'returnDueDate']
        );
      });
    });
  });
});
