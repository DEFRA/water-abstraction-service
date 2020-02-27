const { find, get, set, uniq, cloneDeep } = require('lodash');
const generateReference = require('../../../lib/reference-generator');
const {
  EVENT_STATUS_PROCESSING, EVENT_STATUS_PROCESSED, EVENT_STATUS_SENDING,
  EVENT_STATUS_COMPLETED
} = require('./event-statuses');
const { MESSAGE_STATUS_SENT, MESSAGE_STATUS_ERROR } =
    require('./message-statuses');
const evt = require('../../../lib/event');
const newEvtRepo = require('../../../lib/connectors/repos/events.js');
const queries = require('./queries');

/**
 * Creates a notification event
 * @param  {String}  issuer - email address of user sending message
 * @param {Object} config   - message config
 * @param  {Object}  options   - message data - placed in event metadata
 * @return {Promise}          resolves with event data
 */
const createEvent = async (issuer, config, options) => {
  // Create a reference code
  const referenceCode = generateReference(config.prefix);

  const ev = evt.create({
    referenceCode,
    type: 'notification',
    subtype: config.messageType,
    issuer,
    metadata: {
      options,
      name: config.name
    },
    status: EVENT_STATUS_PROCESSING
  });
  await evt.save(ev);
  return ev;
};

/**
 * Updates event status
 * @param  {String}  eventId   - water service event GUID
 * @param  {String}  status    - new status for event
 * @param  {Object}  [data={}] - optional additional fields to set
 * @return {Promise<Object>}     resolves when event saved with event object
 */
const updateEventStatus = async (eventId, status, data = {}) => {
  const ev = await evt.load(eventId);
  const updates = {
    ...data,
    status
  };
  await newEvtRepo.update(ev, updates);
  return ev;
};

/**
 * Marks event as processed, and also updates the number of messages,
 * licence numbers etc.
 * @param  {String}  eventId - the event ID GUID
 * @param  {Array}  licenceNumbers - list of licence numbers for this notification
 * @param {Number} recipientCount
 * @return {Promise}         resolves when event updated
 */
const markAsProcessed = async (eventId, licenceNumbers, recipientCount) => {
  const ev = await evt.load(eventId);

  const metadata = cloneDeep(ev.metadata);
  set(metadata, 'sent', 0);
  set(metadata, 'error', 0);
  set(metadata, 'recipients', recipientCount);

  const eventUpdates = {
    status: EVENT_STATUS_PROCESSED,
    licences: uniq(licenceNumbers),
    metadata
  };

  return newEvtRepo.update(ev, eventUpdates);
};

/**
 * Gets the number of messages in a certain status, defaulting to 0
 * @param {Array} - array of statuses and counts retrieved from DB
 * @param {String} status - the status to check
 * @return {Number} of messages in the requested status
 */
const getStatusCount = (statuses, status) => {
  return parseInt(get(find(statuses, { status }), 'count', 0));
};

/**
 * Given an event ID, updates the metadata
 * within the event with the number sent/errored, and if all are sent
 * then the status changes to EVENT_STATUS_COMPLETED
 * @param {String} eventId - the event GUID
 * @param {Promise} resolves with event data
 */
const refreshEventStatus = async (eventId) => {
  // Load the event
  const ev = await evt.load(eventId);

  if (ev.status !== EVENT_STATUS_SENDING) {
    return ev;
  }

  // Get breakdown of statuses of messages in this event
  const statuses = await queries.getMessageStatuses(eventId);
  const sent = getStatusCount(statuses, MESSAGE_STATUS_SENT);
  const error = getStatusCount(statuses, MESSAGE_STATUS_ERROR);

  const isComplete = (sent + error) === get(ev, 'metadata.recipients');

  set(ev, 'status', isComplete ? EVENT_STATUS_COMPLETED : EVENT_STATUS_SENDING);
  set(ev, 'metadata.sent', sent);
  set(ev, 'metadata.error', error);

  await evt.save(ev);
  return ev;
};

module.exports = {
  createEvent,
  updateEventStatus,
  markAsProcessed,
  refreshEventStatus
};
