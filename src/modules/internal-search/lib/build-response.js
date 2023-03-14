'use strict'

/**
 * Build response object
 * Only adds key to response if there is >0 data items for that key
 * @param  {Object} response - the API response being built
 * @param  {String} key      - the key for data in the response object
 * @param  {Object|Array} data - the data to add
 */
const buildResponse = (response, key, data) => {
  if (data && 'pagination' in data) {
    if (data.data.length) {
      response[key] = data.data
      response.pagination = data.pagination
    }
  } else if (data && data.length) {
    response[key] = data
  } else if (data && ['billingAccount'].includes(key)) {
    response[key] = data
  }
}

module.exports = {
  buildResponse
}
