/**
 * Get config with default options
 * @param {Object} config
 * @return {Object}
 */
const getConfig = (config) => {
  const defaults = {
    prefix: 'RFORM-',
    rolePriority: ['returns_to', 'licence_holder']
  }

  return Object.assign(defaults, config)
}

/**
 * Parses variables used by the controller out of the request
 * @param {Object} request
 * @return {Object} controller variables
 */
const parseRequest = (request) => {
  const { notificationId: messageRef } = request.params

  // Get params to query returns service
  const { filter, issuer, name, config } = request.payload
  const columns = ['return_id', 'licence_ref']
  const sort = {}

  return {
    messageRef,
    filter,
    issuer,
    name,
    columns,
    sort,
    config: getConfig(config)
  }
}

exports.getConfig = getConfig
exports.parseRequest = parseRequest
