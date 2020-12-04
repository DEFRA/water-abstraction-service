'use strict';

const knex = require('./knex');

/**
 * Allows a query to be run with same arguments
 * as pg.pool.query(query, params)
 * The query and params are altered to make them
 * compatible with knex.raw
 *
 * @param {String} sqlQuery - bound params are specified as $1, $2 etc.
 * @param {Array} [params] - array params
 * @return {Promise<Object>} query result
 */
const query = (sqlQuery, params = []) => {
  if (params.length === 0) {
    return knex.knex.raw(sqlQuery);
  }

  const data = params.reduce((acc, param, i) => {
    // This is the parameter name for the knex query - in knex
    // parameters are passed as a hash
    const key = `param_${i}`;

    // This regex is looking for a pattern such as $4 in the query
    // as this is how bound parameters are specified in the underlying
    // pg library.
    // It is made up of:
    // \\$ a dollar symbol with the necessary escaping since $ is a special char in regex
    // ${i + 1} is the integer to search for
    // (?![0-9]) is a negative lookahead, and ensures the integer isn't followed by another integer
    // - this avoids e.g. $11 being a match when we are replacing $1
    const r = new RegExp(`\\$${i + 1}(?![0-9])`, 'g');

    return {
      params: {
        ...acc.params,
        [key]: param
      },
      sqlQuery: acc.sqlQuery.replace(r, `:${key}`)
    };
  }, { sqlQuery, params: {} });

  return knex.knex.raw(data.sqlQuery, data.params);
};

exports.pool = {
  query
};
