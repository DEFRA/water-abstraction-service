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
const { transformContact } = require('./de-duplicate');
const { enqueue } = require('../../notify')(messageQueue);

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
 * Fetches contacts for the returns specified in the notifications object,
 * and uses them to populate the 'contacts' section
 * @param {Object} state - current notification state
 * @return {Promise} resolves with new state
 */
const fetchReturnsContacts = async (state) => {
  const rolePriority = get(state, 'config.rolePriority', ['licence_holder']);
  const contacts = [];
  for (let ret of state.returns) {
    const filter = {
      system_external_id: ret.licence_ref
    };
    const { data: [contact] } = await getDocumentContacts(filter);
    contact.return_id = ret.return_id;
    contacts.push(transformContact(contact, rolePriority));
  }
  return contacts;
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
  return findAllPages(returns, filter, sort, columns);
};

module.exports = {
  enqueueMessages,
  fetchReturnsContacts,
  fetchReturns
};
