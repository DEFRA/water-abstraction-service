const Joi = require('joi');
const uuidv4 = require('uuid/v4');
const { INIT, SET_RETURN_FILTER, SET_RETURNS, ADD_CONTACT, SET_CONTACTS, CREATE_EVENT } = require('./action-types');

const configSchema = {

  // For non-PDF messages, corresponds to the Notify template to use.
  // PDF messages have pdf. suffix and are rendered locally
  messageRef: Joi.string(),

  // Array of contact roles, message will be sent to first match
  rolePriority: Joi.array().min(1).items(Joi.string()),

  // Email address of the user sending the notification
  issuer: Joi.string().email()

};

/**
 * Creates initial state
 * @return {Object}
 */
const init = (config = {}) => {
  const { error } = Joi.validate(config, configSchema);
  if (error) {
    throw error;
  }

  return {
    type: INIT,
    payload: {

      config,

      // Document header filter
      documentFilter: null,

      // Returns filter
      returnsFilter: null,

      // Task details, when sending notification
      taskConfig: {

      },

      // Event, for storage in event log
      event: {

      },

      // Template variables, when sending HoF/expiry notifications
      params: {

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

module.exports = {
  init,
  setReturnFilter,
  setReturns,
  addContact,
  setContacts,
  createEvent
};
