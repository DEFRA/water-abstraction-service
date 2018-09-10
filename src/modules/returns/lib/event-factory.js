const uuidv4 = require('uuid/v4');
const { mapValues, isObject } = require('lodash');
const moment = require('moment');

/**
 * Given a return model object, generates a row for the events table
 * @param {Object} ret - water service return model object
 * @return {Object} row of data for water service event log
 */
const eventFactory = (ret, version) => {
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

module.exports = {
  eventFactory
};
