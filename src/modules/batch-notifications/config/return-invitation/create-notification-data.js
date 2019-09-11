const uuidv4 = require('uuid/v4');
const moment = require('moment');
const { last } = require('lodash');

const helpers = require('@envage/water-abstraction-helpers');

const { MESSAGE_STATUS_DRAFT } = require('../../lib/message-statuses');
const notifyHelpers = require('../../lib/notify-helpers');
const { readableDate } = require('../../../../lib/dates');
const {
  CONTACT_ROLE_PRIMARY_USER, CONTACT_ROLE_RETURNS_AGENT,
  CONTACT_ROLE_LICENCE_HOLDER, CONTACT_ROLE_RETURNS_TO
} = require('../../../../lib/models/contact');

const getReturnPersonalisation = refDate => {
  const cycles = helpers.returns.date.createReturnCycles(undefined, refDate);
  const { startDate, endDate } = last(cycles);
  const returnDueDate = moment(endDate).add(28, 'day').format('YYYY-MM-DD');
  return {
    periodStartDate: readableDate(startDate),
    periodEndDate: readableDate(endDate),
    returnDueDate: readableDate(returnDueDate)
  };
};

const createNotification = (ev, contact, context) => ({
  id: uuidv4(),
  event_id: ev.eventId,
  licences: context.licenceNumbers,
  metadata: {
    returnIds: context.returnIds
  },
  status: MESSAGE_STATUS_DRAFT
});

const createEmail = (ev, contact, context) => ({
  ...createNotification(ev, contact, context),
  message_type: 'email',
  recipient: contact.email,
  personalisation: getReturnPersonalisation()
});

const createLetter = (ev, contact, context) => ({
  ...createNotification(ev, contact, context),
  message_type: 'letter',
  recipient: 'n/a',
  personalisation: {
    ...getReturnPersonalisation(),
    name: contact.getFullName(),
    ...notifyHelpers.mapContactAddress(contact)
  }
});

const createPrimaryUserEmail = (ev, contact, context) => ({
  message_ref: 'returns_invitation_primary_user_email',
  ...createEmail(ev, contact, context)
});

const createReturnsAgentEmail = (ev, contact, context) => ({
  message_ref: 'returns_invitation_returns_agent_email',
  ...createEmail(ev, contact, context)
});

const createLicenceHolderLetter = (ev, contact, context) => ({
  message_ref: 'returns_invitation_licence_holder_letter',
  ...createLetter(ev, contact, context)
});

const createReturnsToLetter = (ev, contact, context) => ({
  message_ref: 'returns_invitation_returns_to_letter',
  ...createLetter(ev, contact, context)
});

const createNotificationData = (ev, contact, context) => {
  const actions = {
    [CONTACT_ROLE_PRIMARY_USER]: createPrimaryUserEmail,
    [CONTACT_ROLE_RETURNS_AGENT]: createReturnsAgentEmail,
    [CONTACT_ROLE_LICENCE_HOLDER]: createLicenceHolderLetter,
    [CONTACT_ROLE_RETURNS_TO]: createReturnsToLetter
  };
  return actions[contact.role](ev, contact, context);
};

exports.createNotificationData = createNotificationData;
