const { pool } = require('../../../lib/connectors/db')
const { logger } = require('../../../logger')

/**
 * Perform a database query by getting a client from the connection pool and releasing
 * If an error is thrown, the client is still released and the error rethrown
 * @param {String} query - SQL query
 * @param {Array} params - bound SQL query params
 * @return {Promise} resolves with query data
 */
const dbQuery = async (query, params = []) => {
  try {
    const { error, rows } = await pool.query(query, params)
    if (error) {
      throw error
    }
    return rows
  } catch (error) {
    logger.error('dbQuery error', error)
    throw error
  }
}

module.exports = {
  dbQuery
}
