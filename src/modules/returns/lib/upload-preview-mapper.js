const { get, omit } = require('lodash')

/**
 * Gets the total abstracted volume for a return
 * @param  {Object} ret - the return object
 * @return {Number|null} the total volume or null for nil return
 */
const getTotalVolume = ret => {
  if (ret.isNil) {
    return null
  }
  return ret.lines.reduce((acc, line) => {
    return acc + line.quantity
  }, 0)
}

/**
 * Maps return adding total volume
 * @param {Object} validatedReturn - validated return from upload
 * @param  {Object} ret - return record from return service
 * @return {Object} return including totalVolume
 */
const mapSingleReturn = (validatedReturn, ret) => {
  return {
    ...validatedReturn,
    totalVolume: getTotalVolume(validatedReturn),
    metadata: get(ret, 'metadata')
  }
}

/**
 * Maps return adding total volume and removing return lines
 * @param  {Object} ret - return
 * @return {Object} return including totalVolume and excluding lines
 */
const mapMultipleReturn = ret => {
  return {
    ...omit(ret, 'lines'),
    totalVolume: getTotalVolume(ret)
  }
}

module.exports = {
  getTotalVolume,
  mapSingleReturn,
  mapMultipleReturn
}
