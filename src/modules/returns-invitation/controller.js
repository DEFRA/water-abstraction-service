// const uuidv4 = require('uuid/v4');
const { get, isArray } = require('lodash');
// const moment = require('moment');
// const Boom = require('boom');
const { getDocumentContacts } = require('../../lib/connectors/crm/documents');
const { reducer } = require('./lib/reducer');
const { init, setReturnFilter, setReturns, addContact, setContacts, createEvent, setMessages } = require('./lib/action-creators');
const { returns } = require('../../lib/connectors/returns');
const { findAllPages } = require('../../lib/api-client-helpers');

const { eventFactory } = require('./lib/event-factory');

const { transformContact, dedupe, getContactId } = require('./lib/de-duplicate');

const { formatAddressKeys } = require('../returns-notifications/lib/message-helpers');

const { persist: persistEvent } = require('./lib/connectors/event');

const messageQueue = require('../../lib/message-queue');
const { enqueue } = require('../notify')(messageQueue);

const enqueueAll = (state) => {
  const tasks = state.messages.map(message => enqueue(message));
  return Promise.all(tasks);
};

const createMessages = (state) => {
  const messages = state.contacts.map(row => {
    const { contact, data } = row;

    const messageType = contact.email ? 'email' : 'letter';

    const licences = isArray(data) ? data.map(row => row.system_external_id) : [data.system_external_id];

    const messageRef = get(state, `config.messageRef.${messageType}`, state.config.messageRef.default);

    return {
      messageRef,
      recipient: contact.email || 'n/a',
      personalisation: formatAddressKeys(contact),
      sendAfter: state.config.sendAfter,
      licences,
      individualEntityId: contact.entity_id,
      eventId: state.event.event_id,
      messageType
    };
  });

  return reducer(state, setMessages(messages));
};

/**
 * Fetches contacts for the returns specified in the notifications object,
 * and uses them to populate the 'contacts' section
 * @param {Object} state - current notification state
 * @return {Promise} resolves with new state
 */
const fetchReturnsContacts = async (state) => {
  const rolePriority = get(state, 'config.rolePriority', ['licence_holder']);
  for (let ret of state.returns) {
    const filter = {
      system_external_id: ret.licence_ref
    };
    const { data: [contact] } = await getDocumentContacts(filter);
    contact.return_id = ret.return_id;
    const transformed = transformContact(contact, rolePriority);
    state = reducer(state, addContact(transformed, ret.return_id));
  }
  return state;
};

/**
 * De-duplicates the contacts within the notification state
 * by similar contacts.
 * Since contacts are 'grouped' by licence holder, it won't
 * de-dupe if the licence holder is different
 * @param {Object} state
 * @return {Object} new state with de-duplicated contacts array
 */
const dedupeContacts = (state) => {
  const contacts = dedupe(state.contacts, getContactId);
  return reducer(state, setContacts(contacts));
};

/**
 * Async method to fetch returns and populate in the notification state
 * @param {Object} state
 * @return {Promise} resolves with new state
 */
const fetchReturns = async (state) => {
  const { returnsFilter: filter } = state;

  const sort = {};
  const columns = ['return_id', 'licence_ref'];

  // Find all returns matching criteria
  const data = await findAllPages(returns, filter, sort, columns);

  return reducer(state, setReturns(data));
};

const postReturnsInvite = async (request, h) => {
  const { filter } = request.payload;

  // Create state
  let state = reducer({}, init({ name: 'Returns: invitation', messageRef: { default: 'returns_invitation_letter' }, issuer: 'mail@example.com' }));

  // // Set returns filter
  state = reducer(state, setReturnFilter(filter));
  //
  // // Fetch returns
  state = await fetchReturns(state);

  // Fetch returns contacts
  state = await fetchReturnsContacts(state);
  //
  state = dedupeContacts(state);

  state = reducer(state, createEvent('R-INV-XYZ'));

  const ev = eventFactory(state);
  await persistEvent(ev);

  await enqueueAll(state);
  // state = await fetchNotifyTemplates(state);

  // console.log(ev);

  state = createMessages(state);

  return state;
};

module.exports = {
  postReturnsInvite
};
