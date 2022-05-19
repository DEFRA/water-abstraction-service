const camelCaseKeys = require('./camel-case-keys')

/**
 * Takes some data and/or an error and returns a consistent response object shape
 *
 * @param {Any} data The response data to wrap in an envelope
 * @param {Boolean} camelCaseData Should the data have it's keys changed to be camel cased
 * @param {Object} error An error object
 */
const envelope = (data, camelCaseData = false, error = null) => ({
  data: camelCaseData ? camelCaseKeys(data) : data,
  error
})

const errorEnvelope = (error = null) => envelope(null, false, error)

exports.envelope = envelope
exports.errorEnvelope = errorEnvelope
