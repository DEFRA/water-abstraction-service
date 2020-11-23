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
    acc.params[`param_${i}`] = param;
    const r = new RegExp(`\\$${(i + 1)}(?![0-9])`, 'g');
    acc.sqlQuery = acc.sqlQuery.replace(r, `:param_${i}`);
    return acc;
  }, { sqlQuery, params: {} });

  return knex.knex.raw(data.sqlQuery, data.params);
};

exports.pool = {
  query
};
