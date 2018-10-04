const Joi = require('joi');
const uuidv4 = require('uuid/v4');

const {
  INIT, SET_RETURN_FILTER, SET_RETURNS, ADD_CONTACT, SET_CONTACTS, CREATE_EVENT,
  SET_MESSAGES, SET_NOTIFY_TEMPLATE, SET_PERSONALISATION, DEDUPE_CONTACTS,
  CREATE_MESSAGES
} = require('./action-types');
const schema = require('./schema');

/**
 * Creates initial state
 * @return {Object}
 */
const init = (config = {}) => {
  const { error, value } = Joi.validate(config, schema.config);
  if (error) {
    throw error;
  }

  return {
    type: INIT,
    payload: {

      config: value,

      // Document header filter
      documentFilter: null,

      // Returns filter
      returnsFilter: null,

      // Task details, when sending notification
      taskConfig: {

      },

      // Notify template info
      notifyTemplate: {},

      // Event, for storage in event log
      event: {

      },

      // Global personalisation (used as template variables, e.g. when sending HoF/expiry notifications)
      personalisation: {

      },

      // Returns this message relates to
      returns: [],

      // Licences this messsage relates to
      licences: [],

      // Contacts this message relates to
      contacts: [],

      // Array of message objects - one per message sent out
      messages: []
    }
  };
};

const setReturnFilter = (filter) => {
  return {
    type: SET_RETURN_FILTER,
    payload: filter
  };
};

const setReturns = (returns) => {
  return {
    type: SET_RETURNS,
    payload: returns
  };
};

const addContact = (obj) => {
  return {
    type: ADD_CONTACT,
    payload: obj
  };
};

const setContacts = (contacts) => {
  return {
    type: SET_CONTACTS,
    payload: contacts
  };
};

const createEvent = (reference, eventId) => {
  return {
    type: CREATE_EVENT,
    payload: {
      eventId: eventId || uuidv4(),
      reference
    }
  };
};

const setMessages = (messages) => {
  return {
    type: SET_MESSAGES,
    payload: messages
  };
};

const setNotifyTemplate = (templateId, notifyKey = 'test', messageType = 'default') => {
  return {
    type: SET_NOTIFY_TEMPLATE,
    payload: {
      templateId,
      notifyKey,
      messageType
    }
  };
};

const setPersonalisation = (personalisation) => {
  return {
    type: SET_PERSONALISATION,
    payload: personalisation
  };
};

const dedupeContacts = () => {
  return {
    type: DEDUPE_CONTACTS
  };
};

const createMessages = () => {
  return {
    type: CREATE_MESSAGES
  };
};

module.exports = {
  init,
  setReturnFilter,
  setReturns,
  addContact,
  setContacts,
  createEvent,
  setMessages,
  setNotifyTemplate,
  setPersonalisation,
  dedupeContacts,
  createMessages
};
