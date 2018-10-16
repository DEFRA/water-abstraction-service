const {
  INIT, SET_RETURN_FILTER, SET_RETURNS, ADD_CONTACT, SET_CONTACTS, CREATE_EVENT,
  SET_MESSAGES, SET_NOTIFY_TEMPLATE, SET_PERSONALISATION, DEDUPE_CONTACTS,
  CREATE_MESSAGES
} = require('./action-types');

const { dedupe, getContactId } = require('./de-duplicate');
const { messageFactory } = require('./message-factory');

const setReturnFilter = (state, action) => {
  return {
    ...state,
    returnsFilter: action.payload
  };
};

const setReturns = (state, action) => {
  return {
    ...state,
    returns: action.payload
  };
};

const addContact = (state, action) => {
  return {
    ...state,
    contacts: [...state.contacts, action.payload]
  };
};

const setContacts = (state, action) => {
  return {
    ...state,
    contacts: action.payload
  };
};

const createEvent = (state, action) => {
  const { eventId, reference } = action.payload;

  const event = {
    event_id: eventId,
    reference_code: reference,
    type: 'notification'
  };
  return {
    ...state,
    event
  };
};

const setMessages = (state, action) => {
  return {
    ...state,
    messages: action.payload
  };
};

const setNotifyTemplate = (state, action) => {
  const { messageType, ...rest } = action.payload;
  return {
    ...state,
    notifyTemplate: {
      ...state.notifyTemplate,
      [messageType]: rest
    }
  };
};

const setPersonalisation = (state, action) => {
  return {
    ...state,
    personalisation: action.payload
  };
};

const dedupeContacts = (state) => {
  return {
    ...state,
    contacts: dedupe(state.contacts, getContactId)
  };
};

const createMessages = (state) => {
  const messages = state.contacts.map(row => {
    const { contact, data } = row;

    return messageFactory(state, contact, data);
  });
  return {
    ...state,
    messages
  };
};

const reducer = (state, action) => {
  switch (action.type) {
    case INIT:
      return action.payload;

    case SET_RETURN_FILTER:
      return setReturnFilter(state, action);

    case SET_RETURNS:
      return setReturns(state, action);

    case ADD_CONTACT:
      return addContact(state, action);

    case SET_CONTACTS:
      return setContacts(state, action);

    case DEDUPE_CONTACTS:
      return dedupeContacts(state);

    case CREATE_EVENT:
      return createEvent(state, action);

    case SET_MESSAGES:
      return setMessages(state, action);

    case SET_NOTIFY_TEMPLATE:
      return setNotifyTemplate(state, action);

    case SET_PERSONALISATION:
      return setPersonalisation(state, action);

    case CREATE_MESSAGES:
      return createMessages(state, action);

    default:
      return state;
  }
};

module.exports = {
  reducer
};
