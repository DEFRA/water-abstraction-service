const { isArray, uniq } = require('lodash');

/**
 * Given the notification state object, creates an object row which can
 * be written to the water.events table
 * @param {Object} state
 * @return {Object} event
 */
const eventFactory = (state) => {
  const licenceNumbers = state.contacts.reduce((acc, contact) => {
    const arr = isArray(contact.data)
      ? contact.data.map(row => row.system_external_id)
      : [contact.data.system_external_id];
    return [...acc, ...arr];
  }, []);

  const entities = state.contacts.reduce((acc, contact) => {
    const {entity_id: entityId} = contact;
    return entityId ? uniq([...acc, entityId]) : acc;
  }, []);

  const metadata = {
    name: state.config.name,
    recipients: state.contacts.length,
    sent: 0,
    error: 0
  };

  return {
    ...state.event,
    subtype: state.config.messageRef.default,
    issuer: state.config.issuer,
    licences: uniq(licenceNumbers),
    entities: uniq(entities),
    metadata,
    status: ''
  };
};

module.exports = {
  eventFactory
};
