const uuidv4 = require('uuid/v4');
const { mapValues, isObject, get } = require('lodash');
const moment = require('moment');

// Valid event types
const statuses = ['return', 'return.status'];

/**
 * Given a return model object, generates a row for the events table
 * @param {Object} ret - water service return model object
 * @return {Object} row of data for water service event log
 */
const eventFactory = (ret, version, eventType = 'return') => {
  if (!statuses.includes(eventType)) {
    throw new Error(`Invalid event type ${eventType}`);
  }

  const { returnId, licenceNumber, status, receivedDate, underQuery } = ret;
  const { type, email, entityId } = ret.user;
  const versionId = get(version, 'version_id', null);

  const event = {
    event_id: uuidv4(),
    reference_code: null,
    type: eventType,
    subtype: type,
    issuer: email,
    licences: [licenceNumber],
    entities: [entityId],
    comment: ret.comment,
    metadata: {returnId, versionId, return: ret, receivedDate, underQuery},
    status,
    created: moment().format()
  };

  // Stringify object/array values
  return mapValues(event, value => {
    return isObject(value) ? JSON.stringify(value) : value;
  });
};

module.exports = {
  eventFactory
};
