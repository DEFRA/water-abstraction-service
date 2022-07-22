'use strict'

const { getAddressObjectFromArray } = require('./lib/helpers')
/**
 * @module maps service models to Notify address lines
 */

const { omit, pick } = require('lodash')
const { DATA_SOURCE_TYPES } = require('../models/contact-v2')

const MAX_NUMBER_OF_LINES = 7

/**
 * Maps service models to a Notify address personalisation object
 * with no more than 7 lines
 * @param {Object} service models, { address, contact, company }
 * @return {Object} personalisation object for Notify letter
 */
const mapModelsToNotifyAddress = models => {
  const { address, company, contact } = models

  // It's possible that there are gaps in the numbered address lines, eg. address lines 1 & 4 are populated, lines 2 & 3
  // aren't. We therefore "bunch up" the lines, so in the example we would filter out the blank lines and move what's
  // left into lines 1 & 2
  const bunchedAddressLines = _bunchUpAddressLines(address)

  // Get our address head and tail, ie. the lines at the top and bottom of the address that have a fixed format and are
  // not to be concatenated
  const addressHeadArray = _getAddressHeadArray(company, contact, bunchedAddressLines)
  const addressTailArray = _getAddressTailArray(address)

  // Get our address body ie. the address lines in the middle that we can concatenate
  // Note that this is an object so we can manipulate it precisely later
  const addressBodyObject = _getAddressBodyObject({
    ...bunchedAddressLines,
    ...pick(address, 'town', 'county')
  })

  // If the length of the head, body and tail fit in the max number of lines then return the address as-is
  const headTailLength = [...addressHeadArray, ...addressTailArray].length
  if (headTailLength + Object.values(addressBodyObject).length <= MAX_NUMBER_OF_LINES) {
    return _buildAddress(addressHeadArray, addressBodyObject, addressTailArray)
  }

  // Otherwise, return the address with a shortened body
  const shortenedBody = _shortenBody(addressBodyObject, headTailLength)
  return _buildAddress(addressHeadArray, shortenedBody, addressTailArray)
}

/**
 * Takes an address head array, an address body object, and an address tail array, and builds an address object
 */
function _buildAddress (headArray, bodyObject, tailArray) {
  return getAddressObjectFromArray([...headArray, ...Object.values(bodyObject), ...tailArray])
}

/**
 * Takes an address object, removes any empty address lines, and returns the remaining lines renumbered 1-4
 */
function _bunchUpAddressLines (address) {
  // Turn `addressLine1` etc. into an array of values, filtering out any empty lines
  const filteredAddressArray = Object.values(
    pick(address, 'addressLine1', 'addressLine2', 'addressLine3', 'addressLine4')
  ).filter(element => element)

  // Return the remaining values renumbered `addressLine1` etc. so we've now "bunched up" our address lines
  return getAddressObjectFromArray(filteredAddressArray, 'addressLine')
}

/**
 * Returns an array containing the elements we want for the address head (ie. the first few lines of the address that
 * shouldn't be concatenated)
 */
function _getAddressHeadArray (company, contact, addressLines) {
  return [
    // Include the company name if this is a company
    company ? company.name : null,
    // Include the contact name if we have a contact and the data source isn't nald
    (contact && contact.dataSource !== DATA_SOURCE_TYPES.nald) ? `FAO ${contact.fullName}` : null,
    // Always include address line 1
    addressLines.addressLine1
  ]
    // Filter the array that we return to strip out any nulls (ie. if this doesn't have a company/contact name)
    .filter(element => element)
}

/**
 * Returns an object containing the elements we want for the address body (ie. the lines in the middle of the address
 * that could be concatenated)
 */
function _getAddressBodyObject (address) {
  return pick(address, 'addressLine2', 'addressLine3', 'addressLine4', 'town', 'county')
}

/**
 * Returns an array containing the elements we want for the address tail (ie. the lines at the end of the address that
 * can't be concatenated)
 */
function _getAddressTailArray (address) {
  return [
    address.postcode,
    // If this is not a UK address then include the country
    !address.isUKAddress ? address.country : null
  ]
    // We filter the array that we return to strip out any nulls (ie. if we haven't included the country)
    .filter(element => element)
}

/**
 * Returns an object of the address body with elements removed/concatenated to fit into the correct number of lines
 */
function _shortenBody (addressBody, headTailLength) {
  // Start by removing the county from the address body
  // If that fits us under the limit then return the address without county
  const addressBodyWithoutCounty = omit(addressBody, 'county')
  if (headTailLength + Object.values(addressBodyWithoutCounty).length <= MAX_NUMBER_OF_LINES) {
    return addressBodyWithoutCounty
  }

  // Now try removing addressLine4
  const addressBodyWithoutCountyOrLine4 = omit(addressBodyWithoutCounty, 'addressLine4')
  if (headTailLength + Object.values(addressBodyWithoutCountyOrLine4).length <= MAX_NUMBER_OF_LINES) {
    return addressBodyWithoutCountyOrLine4
  }

  // Otherwise, concatenate lines 2 and 3 and return just that plus the town
  return {
    addressLine2: [addressBody.addressLine2, addressBody.addressLine3].join(', '),
    town: addressBody.town
  }
}

exports.mapModelsToNotifyAddress = mapModelsToNotifyAddress
