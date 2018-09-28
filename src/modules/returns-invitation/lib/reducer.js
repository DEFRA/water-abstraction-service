const { INIT, SET_RETURN_FILTER, SET_RETURNS, ADD_CONTACT, SET_CONTACTS, CREATE_EVENT, SET_MESSAGES, SET_NOTIFY_TEMPLATE, SET_PERSONALISATION } = require('./action-types');

const reducer = (state, action) => {
  switch (action.type) {
    case INIT:
      return action.payload;

    case SET_RETURN_FILTER:
      return {
        ...state,
        returnsFilter: action.payload
      };

    case SET_RETURNS:
      return {
        ...state,
        returns: action.payload
      };

    case ADD_CONTACT:
      return {
        ...state,
        contacts: [...state.contacts, action.payload]
      };

    case SET_CONTACTS:
      return {
        ...state,
        contacts: action.payload
      };

    case CREATE_EVENT:
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

    case SET_MESSAGES:
      return {
        ...state,
        messages: action.payload
      };

    case SET_NOTIFY_TEMPLATE:
      const { messageType, ...rest } = action.payload;
      return {
        ...state,
        notifyTemplate: {
          ...state.notifyTemplate,
          [messageType]: rest
        }
      };

    case SET_PERSONALISATION:
      return {
        ...state,
        personalisation: action.payload
      };

    default:
      return state;
  }
};

module.exports = {
  reducer
};
