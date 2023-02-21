'use strict'

const Boom = require('@hapi/boom')

/**
 * Loads exactly one record by ID or filter from specified repository
 * If !=1 record found, or DB error, a Boom
 * error is thrown
 * @param {Object} repo - the repository from @envage/hapi-pg-rest-api
 * @param {Mixed} id - ID or filter criteria
 * @return {Promise} resolves with single row of data
 */
const findOne = async (repository, id) => {
  const { primaryKey } = repository.config
  const filter = id instanceof Object ? id : { [primaryKey]: id }

  let response

  try {
    response = await repository.find(filter)
  } catch (error) {
    throw Boom.boomify(error)
  }

  const { error, rows } = response

  if (error) {
    throw Boom.badImplementation('findOne DB error', error)
  }

  if (rows.length !== 1) {
    throw Boom.notFound(`Could not find exactly 1 record in for ${JSON.stringify(filter)}`)
  }

  return rows[0]
}

module.exports = {
  findOne
}
