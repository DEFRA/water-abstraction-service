'use strict'

const urlJoin = require('url-join')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

const getUri = (...tail) => urlJoin(config.services.crm_v2, 'addresses', ...tail)

/**
 * Get a single address
 * @param {String} addressId The uuid of the address to retrieve
 */
const getAddress = addressId => serviceRequest.get(getUri(addressId))

/**
 * Creates an address entity in the CRM
 *
 * @param {Object} address The address data to save in the CRM
 */
const createAddress = async address => {
  const uri = getUri()
  return serviceRequest.post(uri, { body: address })
}

/**
 * Deletes an address entity in the CRM
 *
 * @param {Object} address The address data to save in the CRM
 */
const deleteAddress = async addressId => serviceRequest.delete(getUri(addressId))

exports.getAddress = getAddress
exports.createAddress = createAddress
exports.deleteAddress = deleteAddress
