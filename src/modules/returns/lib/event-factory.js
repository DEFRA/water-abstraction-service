const uuidv4 = require('uuid/v4');
const { mapValues, isObject } = require('lodash');
const moment = require('moment');

/**
 * Given a return model object, generates a row for the events table
 * @param {Object} ret - water service return model object
 * @return {Object} row of data for water service event log
 */
const submitEvent = (ret, version) => {
  const { type, email, entityId } = ret.user;
  const { returnId, licenceNumber, status } = ret;
  const { version_id: versionId } = version;

  const event = {
    event_id: uuidv4(),
    reference_code: null,
    type: 'return',
    subtype: type,
    issuer: email,
    licences: [licenceNumber],
    entities: [entityId],
    comment: ret.comment,
    metadata: {returnId, versionId, return: ret},
    status,
    created: moment().format()
  };

  // Stringify object/array values
  return mapValues(event, value => {
    return isObject(value) ? JSON.stringify(value) : value;
  });
};

/**
 * Creates an event for the event log when the return status is updated
 * This can include - return status, received date, under query
 * @param {Object} ret - return model
 * @return {Object} event
 */
const updateStatusEvent = (ret) => {
  const { returnId, licenceNumber, status, receivedDate, underQuery, user } = ret;
  const { type, email, entityId } = user;

  const event = {
    event_id: uuidv4(),
    reference_code: null,
    type: 'return.status',
    subtype: type,
    issuer: email,
    licences: [licenceNumber],
    entities: [entityId],
    comment: ret.comment,
    metadata: {returnId, receivedDate, underQuery, return: ret},
    status,
    created: moment().format()
  };

  // Stringify object/array values
  return mapValues(event, value => {
    return isObject(value) ? JSON.stringify(value) : value;
  });
};

module.exports = {
  submitEvent,
  updateStatusEvent
};
