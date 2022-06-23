/**
 * Tests whether the query is for a user - e.g. contains '@' character
 * @param  {String}  query - the search query
 * @return {Boolean}       returns true if a user search
 */
const isUserQuery = query => query.includes('@')

/**
 * Tests whether the query is for a return ID - i.e. a scanned QR code
 * @param  {String}  query - the search query
 * @return {Boolean}       returns true if an exact return ID
 */
const isReturnId = query => {
  const pattern = /^v1:[1-8]:[^:]+:[0-9]+:[0-9]{4}-[0-9]{2}-[0-9]{2}:[0-9]{4}-[0-9]{2}-[0-9]{2}$/
  return pattern.test(query)
}

/**
 * Tests whether the query is for a billing account reference
 * @param  {String}  query - the search query
 * @return {Boolean}       returns true if an exact billing account reference
 */
const isBillingAccountReference = query => {
  const pattern = /^[ABENSTWY][0-9]{8}A$/
  return pattern.test(query)
}

/**
 * Tests whether the query could be for a return format ID
 * - i.e. only contains numbers 0-9
 * @param  {String}  query - the search query
 * @return {Boolean}       returns true if is a numeric search
 */
const isNumeric = query => {
  const pattern = /^[0-9]+$/
  return pattern.test(query)
}

/**
 * Parses the request to determine query, sort, pagination and search mode
 * @param  {String} query - the user's query
 * @return {Object}         object containing parsed request
 */
const parseQuery = (query) => {
  return {
    isNumeric: isNumeric(query),
    isUser: isUserQuery(query),
    isReturnId: isReturnId(query),
    isBillingAccountReference: isBillingAccountReference(query.toUpperCase())
  }
}

module.exports = {
  parseQuery,
  isReturnId
}
