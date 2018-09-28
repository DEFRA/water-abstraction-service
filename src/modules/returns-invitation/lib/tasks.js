/**
 * Sync and async tasks that modify the notification state to build up
 * the notification object ready for sending
 */

// Third-party dependencies
const { get } = require('lodash');

// Library dependencies
const { getDocumentContacts } = require('../../../lib/connectors/crm/documents');
const { findAllPages } = require('../../../lib/api-client-helpers');
const messageQueue = require('../../../lib/message-queue');
const { returns } = require('../../../lib/connectors/returns');

// Module dependencies
const { enqueue } = require('../../notify')(messageQueue);
const { messageFactory } = require('./message-factory');
const { reducer } = require('./reducer');
const { transformContact, dedupe, getContactId } = require('./de-duplicate');

const { setMessages, addContact, setContacts, setReturns } = require('./action-creators');

/**
 * Enqueues all messages for sending in the notification state to PG boss
 * @param {Object} state - notification state
 * @return {Promise} resolves when all messages enqueued
 */
const enqueueMessages = (state) => {
  const tasks = state.messages.map(message => enqueue(message));
  return Promise.all(tasks);
};

/**
 * Populates the `messages` key of the state by iterating over
 * the contacts array and assembling data required for the enqueue() method
 * @param {Object} state
 * @return {Object} next state
 */
const createMessages = (state) => {
  const messages = state.contacts.map(row => {
    const { contact, data } = row;

    return messageFactory(state, contact, data);
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

module.exports = {
  enqueueMessages,
  createMessages,
  fetchReturnsContacts,
  dedupeContacts,
  fetchReturns
};
