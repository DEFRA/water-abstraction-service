const { isArray, get, pick, set } = require('lodash');

/**
 * Formats name
 * @param  {Object} contact - from CRM contacts call
 * @return {String}         - formatted name
 */
const formatName = (contact) => {
  const keys = contact.initials
    ? ['salutation', 'initials', 'name']
    : ['salutation', 'forename', 'name'];
  const parts = Object.values(pick(contact, keys));
  return parts.filter(x => x).join(' ');
};

/**
 * Formats contact address to format expected by Notify
 * @param {Object} contact
 * @return {Object} notify address
 */
const formatAddress = (contact) => {
  const { postcode } = contact;
  const values = pick(contact, ['address_1', 'address_2', 'address_3', 'address_4', 'town', 'county']);
  const addressLines = [formatName(contact), ...Object.values(values)].filter(value => value);
  return addressLines.reduce((acc, value, index) => {
    return set(acc, `address_line_${index + 1}`, value);
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
  formatName,
  messageFactory
};
