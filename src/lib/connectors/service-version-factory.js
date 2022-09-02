const { serviceRequest, urlJoin } = require('@envage/water-abstraction-helpers')
const { URL } = require('url')

/**
 * Takes a service endpoint which may contain path segments (e.g. http://localhost:8001/api)
 * and creates a handler function for http://localhost:8001/status.
 *
 * This is a convieniece function becuase the water service needs to check the
 * status of the downstream services for the service-status resource.
 *
 * @param {String} endPointUrl The URL of the downstream service to get status for.
 * @returns {Function} A request handler function that gets the version of the downstream service.
 */
const create = (endPointUrl) => async () => {
  const urlParts = new URL(endPointUrl)
  const url = urlJoin(urlParts.protocol, urlParts.host, 'status')
  const response = await serviceRequest.get(url)
  return response.version
}

exports.create = create
