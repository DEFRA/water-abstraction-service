const { get } = require('lodash')
const { throwIfError } = require('@envage/hapi-pg-rest-api')
const idm = require('../../../lib/connectors/idm')
const { getPagination } = require('./pagination')

const columns = ['user_id', 'user_name', 'role']
const sort = { user_name: 1 }

/**
 * Gets filter object to search for users in IDM
 * @param  {String} query - the search term
 * @return {Object}       - filter object for IDM users API
 */
const getFilter = (query) => {
  return {
    user_name: {
      $ilike: `%${query}%`
    }
  }
}

/**
 * Maps response from users API - throws error if error present in response,
 * otherwise returns data
 * @param  {Object} response - from IDM users API
 * @return {Array}          - users
 */
const mapRow = (row) => {
  const scopes = get(row, 'role.scopes', [])
  return {
    userId: row.user_id,
    email: row.user_name,
    isInternal: scopes.includes('internal'),
    isExternal: scopes.includes('external')
  }
}

/**
 * Search users in IDM
 * @param  {String} query - the search term
 * @return {Promise}      - responds with API response
 */
const searchUsers = async (query, page) => {
  const response = await idm.usersClient.findMany(getFilter(query), sort, getPagination(page), columns)
  throwIfError(response.error)
  return {
    pagination: response.pagination,
    data: response.data.map(mapRow)
  }
}

module.exports = {
  getFilter,
  mapRow,
  searchUsers
}
