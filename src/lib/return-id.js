'use strict'

/**
 * Internal copy of the return ID regex and parser.
 *
 * This is intentionally not sourced from @envage/water-abstraction-helpers -
 * that package cannot be released for security reasons, so changes to the
 * regex (eg. allowing new region codes) must be duplicated here. This
 * mirrors the approach taken in water-abstraction-ui, which also keeps its
 * own local copy rather than depending on the helpers package.
 */
const returnIDRegex = /^v1:[1-9]:[^:]+:[0-9]+:[0-9]{4}-[0-9]{2}-[0-9]{2}:[0-9]{4}-[0-9]{2}-[0-9]{2}$/

/**
 * Parses a return ID into constituent variables
 * @param {String} returnId
 * @return {Object}
 */
const parseReturnId = returnId => {
  const [versionStr, regionCode, licenceNumber, formatId, startDate, endDate] = returnId.split(':')
  const version = parseFloat(versionStr.replace('v', ''))
  return { version, regionCode, licenceNumber, formatId, startDate, endDate }
}

exports.returnIDRegex = returnIDRegex
exports.parseReturnId = parseReturnId
