const event = require('../../../../lib/event');
const { uploadStatus } = require('../returns-upload');

/**
 * Creates an object that describes the error that has happened
 * that will end the processing of the current event.
 *
 * @param {Error} error The thrown JavaScript error
 * @returns {Object} The error details to save in the event
 */
const createEventError = (error = {}) => {
  const { message, key = 'server' } = error;
  return { message, key };
};

/**
 * Adds the new event error details to the event metadata whilst
 * preserving any existing data.
 *
 * @param {Object} evt The current event
 * @param {Object} eventError The error details to save with the event
 * @returns {Object} The updated metadata including the new error details
 */
const getUpdatedEventMetadata = (evt, eventError) =>
  Object.assign({}, evt.metadata, { error: eventError });

/**
 * Updates the event to include error information.
 *
 * The error may have been an unexpected exception in which case the key will
 * be set to server, or it may be a known error in which case the error.key
 * property will be used.
 *
 * Also sets the event status to error and saves the event.
 *
 * @param {Object} event The event object from the water.events table
 * @param {Error} error The thrown JavaScript error
 * @returns {Promise}
 */
const setEventError = (evt, error) => {
  const eventError = createEventError(error);
  evt.metadata = getUpdatedEventMetadata(evt, eventError);
  evt.status = uploadStatus.ERROR;
  return event.save(evt);
};

exports.setEventError = setEventError;
exports.keys = {
  SERVER: 'server',
  USER_NOT_FOUND: 'user-not-found',
  XML_TO_JSON_MAPPING: 'xml-to-json-mapping-failure',
  INVALID_XML: 'invalid-xml'
};
