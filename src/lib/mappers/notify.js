'use strict'

const { getAddressObjectFromArray } = require('./lib/helpers')
/**
 * @module maps service models to Notify address lines
 */

const { pick } = require('lodash')
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
  const addressBodyObject = _getAddressBodyObject({
    ...bunchedAddressLines,
    ...pick(address, 'town', 'county')
  }, addressHeadArray, addressTailArray)

  return _buildAddress(addressHeadArray, addressBodyObject, addressTailArray)
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
 * that could be concatenated). The body will be shortened if we need to in order for it to fit in the remaining lines
 */
function _getAddressBodyObject (addressBody, headArray, tailArray) {
  // Chop addressLine1 off the top as this is already in the address head
  const cutBody = { ...addressBody }
  delete cutBody.addressLine1

  // If our cut body fits into the remaining number of lines, just return it as-is
  const headTailLength = [...headArray, ...tailArray].length
  if (headTailLength + Object.values(cutBody).length <= MAX_NUMBER_OF_LINES) {
    return cutBody
  }

  // Otherwise, try removing the county and see if that fits
  const bodyWithoutCounty = { ...cutBody }
  delete bodyWithoutCounty.county
  if (headTailLength + Object.values(bodyWithoutCounty).length <= MAX_NUMBER_OF_LINES) {
    return bodyWithoutCounty
  }

  // Now try removing addressLine4
  const bodyWithoutCountyOrLine4 = { ...bodyWithoutCounty }
  delete bodyWithoutCountyOrLine4.addressLine4
  if (headTailLength + Object.values(bodyWithoutCountyOrLine4).length <= MAX_NUMBER_OF_LINES) {
    return bodyWithoutCountyOrLine4
  }

  // Otherwise, concatenate lines 2 and 3 and return just that plus the town
  return {
    addressLine2: [addressBody.addressLine2, addressBody.addressLine3].join(', '),
    town: addressBody.town
  }
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

exports.mapModelsToNotifyAddress = mapModelsToNotifyAddress
