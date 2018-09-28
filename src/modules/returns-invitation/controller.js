// Third-party dependencies
const { pick } = require('lodash');

// Module dependencies
const { reducer } = require('./lib/reducer');
const { init, setReturnFilter, createEvent, setPersonalisation } = require('./lib/action-creators');
const { fetchReturns, fetchReturnsContacts, dedupeContacts, createMessages, enqueueMessages } = require('./lib/tasks');

const { eventFactory } = require('./lib/event-factory');

const { persist: persistEvent } = require('./lib/connectors/event');

const generateReference = require('../../lib/reference-generator');

const postReturnsInvite = async (request, h) => {
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
  await persistEvent(ev);

  // Create messages and queue
  state = createMessages(state);
  await enqueueMessages(state);

  // Output
  return pick(state, ['config', 'event']);
};

module.exports = {
  postReturnsInvite
};
