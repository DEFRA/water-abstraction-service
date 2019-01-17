const { isArray, get, pick } = require('lodash');

/**
 * Formats contact address to format expected by Notify
 * @param {Object} contact
 * @return {Object} notify address
 */
const formatAddress = (contact) => {
  const { postcode } = contact;
  const values = pick(contact, ['name', 'address_1', 'address_2', 'address_3', 'address_4', 'town', 'county']);

  const addressLines = Object.values(values).filter(value => value);
  return addressLines.reduce((acc, value, index) => {
    return {
      [`address_line_${index + 1}`]: value,
      ...acc
    };
  }, { postcode });
};

/**
 * Creates a message object which is ready to send to the enqueue() method in the Notify
 * module
 * @param {Object} state - notification state
 * @param {Object} contact - contact details of the recipient
 * @param {Object} data - information about licence(s), return(s) etc for this message
 * @return {Object} message data
 */
const messageFactory = (state, contact, data) => {
  const messageType = contact.email ? 'email' : 'letter';

  const licences = isArray(data) ? data.map(row => row.system_external_id) : [data.system_external_id];

  const messageRef = get(state, `config.messageRef.${messageType}`, state.config.messageRef.default);

  const personalisation = Object.assign({}, state.personalisation, data, formatAddress(contact));

  return {
    messageRef,
    recipient: contact.email || 'n/a',
    personalisation,
    sendAfter: state.config.sendAfter,
    licences,
    individualEntityId: contact.entity_id,
    eventId: state.event.event_id,
    messageType
  };
};

module.exports = {
  messageFactory
};
