'use strict'

const { getAddressObjectFromArray, combineAddressLines } = require('./lib/helpers')
/**
 * @module maps service models to Notify address lines
 */

const { identity, pick } = require('lodash')
const { DATA_SOURCE_TYPES } = require('../models/contact-v2')

/**
 * Maps service models to a Notify address personalisation object
 * with no more than 7 lines
 * @param {Object} service models, { address, contact, company }
 * @return {Object} personalisation object for Notify letter
 */
const mapModelsToNotifyAddress = models => {
  const { address, company, contact } = models
  const lines = []
  const maxNumberOfLines = 7
let noOfLines = 0
  if (company) {
    // lines.push(company.name)
    noOfLines += 1
  } else if (contact && (contact.dataSource !== DATA_SOURCE_TYPES.nald)) {
    // lines.push(`FAO ${contact.fullName}`)
    noOfLines += 1
  }

  // Get non-empty address lines in order
  const addressLines = Object.values(
    pick(address, 'addressLine1', 'addressLine2', 'addressLine3', 'addressLine4', 'town', 'county', 'postcode')
  ).filter(identity)

  // lines.push(...addressLines)
  noOfLines += addressLines.length

  if (!address.isUKAddress) {
    // lines.push(address.country)
    noOfLines += 1
  }

  const noLinesOver = Math.max(noOfLines - maxNumberOfLines, 0)

  const arr = combineAddressLines(lines, 7)

  return getAddressObjectFromArray(arr)
}

exports.mapModelsToNotifyAddress = mapModelsToNotifyAddress
