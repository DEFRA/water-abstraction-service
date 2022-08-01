const moment = require('moment')
const { find, intersection } = require('lodash')

const inReviewFilter = action => action.payload.status === 'In review'
const approvedFilter = action => action.payload.status === 'Approved'

/**
 * Given an action in the AR licence, returns the timestamp formatted as string
 * @param {Object} action
 * @return {String} ISO 8601 formatted timestamp
 */
const getActionTimestamp = (action) => {
  return moment(action.payload.timestamp).format()
}

/**
 * Gets the ISO 8601 timestamp of the first edit
 * @param {Array} actions - array of actions within the AR licence
 * @return {String} ISO 8601 timestamp
 */
const getFirstEditTimestamp = (actions) => {
  return actions.length ? getActionTimestamp(actions[0]) : null
}

/**
 * Gets timestamp of the first action that passes the predicate
 * @param {Array} actions - array of actions within the AR licence
 * @param {Function} - predicate
 * @return {String} ISO 8601 timestamp
 */
const getTimestamp = (actions, predicate) => {
  const action = find(actions, predicate)
  return action ? getActionTimestamp(action) : null
}

/**
 * Checks whether a party or address has been edited within the supplied
 * array of AR licence actions
 * @param {Array} actions - array of actions within the AR licence
 * @return {Boolean} whether contact edited
 */
const isContactEdited = (actions) => {
  const actionTypes = actions.map(action => action.type)
  return intersection(['edit.party', 'edit.address'], actionTypes).length > 0
}

const getStatus = status => status || 'In progress'

/**
 * A function to map an AR licence JSON object to a row of data for the
 * AR analysis table
 * @param {Number} regionCode - the NALD region code
 * @param {String} licenceRef - the licence number
 * @param {Object} licence - the AR licence object from the permit repo
 * @return {Object}
 */
const mapLicenceToTableRow = (regionCode, licenceRef, licence) => {
  const { status, actions } = licence
  return {
    licence_ref: licenceRef,
    status: getStatus(status),
    region_code: parseInt(regionCode),
    start_date: getFirstEditTimestamp(actions),
    review_date: getTimestamp(actions, inReviewFilter),
    approved_date: getTimestamp(actions, approvedFilter),
    contact_correct: !isContactEdited(actions)
  }
}

module.exports = {
  mapLicenceToTableRow
}
