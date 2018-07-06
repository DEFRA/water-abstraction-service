const { pool } = require('../../../lib/connectors/db');

/**
 * Perform a database query by getting a client from the connection pool and releasing
 * If an error is thrown, the client is still released and the error rethrown
 * @param {String} query - SQL query
 * @param {Array} params - bound SQL query params
 * @return {Promise} resolves with query data
 */
const dbQuery = async (query, params = []) => {
  const client = await pool.connect();
  try {
    const res = await client.query(query, params);
    client.release();
    return res.rows;
  } catch (error) {
    console.error(error);
    client.release();
    throw error;
  }
};

module.exports = {
  dbQuery
};
