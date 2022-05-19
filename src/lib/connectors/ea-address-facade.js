'use strict'

const { http } = require('@envage/water-abstraction-helpers')
const config = require('../../../config')
const { set } = require('lodash')
const urlJoin = require('url-join')

/**
 * Makes a request to the EA address facade
 *
 * @param {Object} options
 * @return {Promise<Object>} response payload
 */
const eaAddressFacadeRequest = (tail, options = {}) => {
  const requestOptions = {
    method: 'GET',
    uri: urlJoin(config.eaAddressFacade.uri, tail),
    json: true,
    ...options
  }
  set(requestOptions, 'qs.key', 'client1')
  return http.request(requestOptions)
}

/**
 * Search OS places for addresses with the given postcode
 *
 * @param {Strign} postcode - valid UK postcode
 * @return {Promise<Object>} response payload
 */
const getAddressesByPostcode = postcode => {
  return eaAddressFacadeRequest('/address-service/v1/addresses/postcode', {
    qs: {
      'query-string': postcode
    }
  })
}

exports.getAddressesByPostcode = getAddressesByPostcode
