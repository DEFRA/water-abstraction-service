const { get, isArray, uniq } = require('lodash');
const { getDocumentContacts } = require('../../lib/connectors/crm/documents');
const { reducer } = require('./lib/reducer');
const { init, setReturnFilter, setReturns, addContact, setContacts, createEvent } = require('./lib/action-creators');
const { returns } = require('../../lib/connectors/returns');
const { findAllPages } = require('../../lib/api-client-helpers');

const { transformContact, dedupe, getContactId } = require('./lib/de-duplicate');

/**
 * Given the notification state object, creates an object row which can
 * be written to the water.events table
 * @param {Object} state
 * @return {Object} event
 */
const createEventRow = (state) => {
  const licences = state.contacts.reduce((acc, contact) => {
    const arr = isArray(contact.data)
      ? contact.data.map(row => row.system_external_id)
      : [contact.data.system_external_id];
    return [...acc, ...arr];
  }, []);

  const entities = state.contacts.reduce((acc, contact) => {
    const {entity_id: entityId} = contact;
    return entityId ? uniq([...acc, entityId]) : acc;
  }, []);

  state.contacts.map(contact => contact.entity_id).filter(id => id !== null);

  const metadata = {
    recipients: state.contacts.length,
    sent: 0,
    error: 0
  };

  return {
    ...state.event,
    subtype: state.config.messageRef,
    issuer: state.config.issuer,
    licences,
    entities: uniq(entities),
    metadata,
    status: ''
  };
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
  let state = reducer({}, init({ messageRef: 'returns.invitation', issuer: 'mail@example.com'}));

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

  console.log(createEventRow(state));

  return state;
};

module.exports = {
  postReturnsInvite
};
