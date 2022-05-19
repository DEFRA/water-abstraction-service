'use strict'

/**
 * Creates a unique id by including the NALD type, region code and
 * id into a single string. This is because historically each region had
 * a different database and therefore the ids are not unique.
 */
const createUniqueId = (type, regionCode, id) => `nald://${type}/${regionCode}/${id}`

/**
 * Takes the unique id in the format created by the `createUniqueId`
 * function and extracts the type, id and region code
 */
const parseUniqueId = uniqueId => {
  const [type, regionCode, ...rest] = uniqueId.replace(/^nald:\/\//, '').split('/')
  return { type, regionCode, id: rest.join('/') }
}

/**
 * Gets full name for a NALD contact
 * @param  {String|null} salutation
 * @param  {String|null} initials
 * @param  {String|null} firstName
 * @param  {String|null} lastName
 * @return {String}      full licence holder name
 */
const getFullName = (salutation, initials, firstName, lastName) => {
  const parts = [salutation, initials || firstName, lastName]
  return parts.filter(x => x).join(' ')
}

/**
 * Gets an array of aggregate quantities for a given purpose
 * @param  {Object} purpose - purpose object from NALD data
 * @return {Array}         - array of items with { name, value }
 */
const getAggregateQuantities = (purpose) => {
  const names = {
    ANNUAL_QTY: 'cubic metres per year',
    DAILY_QTY: 'cubic metres per day',
    HOURLY_QTY: 'cubic metres per hour',
    INST_QTY: 'litres per second'
  }

  return Object.keys(names).reduce((acc, key) => {
    if (purpose[key] !== null) {
      acc.push({
        name: names[key],
        value: purpose[key]
      })
    }
    return acc
  }, [])
}

exports.createUniqueId = createUniqueId
exports.parseUniqueId = parseUniqueId
exports.getFullName = getFullName
exports.getAggregateQuantities = getAggregateQuantities
