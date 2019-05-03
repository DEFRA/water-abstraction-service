const uuidv4 = require('uuid/v4');
const { uniq, get } = require('lodash');
const { returns: { date: { getPeriodStart, getPeriodEnd } } } = require('@envage/water-abstraction-helpers');

const { MESSAGE_STATUS_DRAFT } = require('../../lib/message-statuses');
const notifyHelpers = require('../../lib/notify-helpers');
const { readableDate } = require('../../../../lib/dates');

/**
 * Creates personalisation object to create notification - this includes the
 * address and other data needed by the template
 * @param  {Object} ev      - event object from water.events table
 * @param  {Object} ret     - return row loaded from returns service
 * @param  {Contact} contact - contact model
 * @return {Object}         personalisation data to send to Notify
 */
const createNotificationPersonalisation = (ev, ret, contact) => {
  const isSummer = get(ret, 'metadata.isSummer');

  return {
    ...notifyHelpers.mapContactAddress(contact),
    date: readableDate(ret.due_date),
    startDate: readableDate(getPeriodStart(ret.end_date, isSummer)),
    endDate: readableDate(getPeriodEnd(ret.end_date, isSummer))
  };
};

const createNotificationData = (ev, group) => {
  const { return: ret, contact } = group[0];
  const licences = uniq(group.map(row => row.return.licence_ref));
  return {
    id: uuidv4(),
    recipient: 'n/a',
    message_type: 'letter',
    message_ref: 'returns_invitation_letter',
    personalisation: createNotificationPersonalisation(ev, ret, contact),
    status: MESSAGE_STATUS_DRAFT,
    licences,
    event_id: ev.eventId,
    metadata: {
      return_id: ret.return_id
    }
  };
};

module.exports = {
  createNotificationData
};
