// Module dependencies
const { reducer } = require('./lib/reducer');
const {
  init, setReturnFilter, createEvent, setPersonalisation, setReturns,
  setContacts, dedupeContacts, createMessages
} = require('./lib/action-creators');
const { fetchReturns, fetchReturnsContacts } = require('./lib/tasks');

const { eventFactory } = require('./lib/event-factory');

const { persist: persistEvent } = require('./lib/connectors/event');

const generateReference = require('../../lib/reference-generator');

const messageQueue = require('../../lib/message-queue');

/**
 * Sets up state for sending a returns message
 * @param  {Object}  config          - message configuration options
 * @param  {Object}  personalisation - message personalisation that applies to all messages
 * @param  {Object}  filter          - filter for locating returns in returns service
 * @return {Promise}                 - state object
 */
const getReturnsMessageState = async (config, personalisation, filter) => {
  // Create initial state
  let state = reducer({}, init(config));

  // Set request data
  state = reducer(state, setPersonalisation(personalisation));
  state = reducer(state, setReturnFilter(filter));

  // Fetch returns
  const returns = await fetchReturns(state);
  state = reducer(state, setReturns(returns));

  // Fetch returns contacts & de-duplicate
  const contacts = await fetchReturnsContacts(state);
  state = reducer(state, setContacts(contacts));
  if (config.deDupe) {
    state = reducer(state, dedupeContacts());
  }

  const ref = generateReference(state.config.prefix);
  return reducer(state, createEvent(ref));
};

const returnsInvite = async (request, isPreview = true) => {
  const { filter, personalisation, config } = request.payload;

  let state = await getReturnsMessageState(config, personalisation, filter);

  // Create and persist event
  const ev = eventFactory(state);

  if (!isPreview) {
    await persistEvent(ev);
  }

  state = reducer(state, createMessages());

  if (!isPreview) {
    await messageQueue.publish('notification.enqueue', { state });
  }

  return {
    config: state.config,
    event: ev,
    ...request.query.verbose && { messages: state.messages }
  };
};

const postReturnsInvitePreview = async (request, h) => {
  return returnsInvite(request, true);
};

const postReturnsInvite = async (request, h) => {
  return returnsInvite(request, false);
};

module.exports = {
  postReturnsInvitePreview,
  postReturnsInvite
};
