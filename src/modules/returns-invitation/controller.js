
// Module dependencies
const { reducer } = require('./lib/reducer');
const { init, setReturnFilter, createEvent, setPersonalisation } = require('./lib/action-creators');
const { fetchReturns, fetchReturnsContacts, dedupeContacts, createMessages, enqueueMessages } = require('./lib/tasks');

const { eventFactory } = require('./lib/event-factory');

const { persist: persistEvent } = require('./lib/connectors/event');

const generateReference = require('../../lib/reference-generator');

const returnsInvite = async (request, isPreview = true) => {
  const { filter, personalisation, config } = request.payload;

  // Create initial state
  let state = reducer({}, init(config));

  // Set request data
  state = reducer(state, setPersonalisation(personalisation));
  state = reducer(state, setReturnFilter(filter));

  // Fetch returns
  state = await fetchReturns(state);

  // Fetch returns contacts & de-duplicate
  state = await fetchReturnsContacts(state);
  state = dedupeContacts(state);

  const ref = generateReference(state.config.prefix);
  state = reducer(state, createEvent(ref));

  // Create and persist event
  const ev = eventFactory(state);

  if (!isPreview) {
    await persistEvent(ev);
  }

  // Create messages and queue
  state = createMessages(state);

  if (!isPreview) {
    await enqueueMessages(state);
  }

  // Output
  return {
    config: state.config,
    event: ev
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
