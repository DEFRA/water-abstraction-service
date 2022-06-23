const { set } = require('lodash')

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
      set(response, key, data.data)
      set(response, 'pagination', data.pagination)
    }
  } else if (data && data.length) {
    set(response, key, data)
  } else if (data && ['billingAccount'].includes(key)) {
    set(response, key, data)
  }
}

module.exports = {
  buildResponse
}
