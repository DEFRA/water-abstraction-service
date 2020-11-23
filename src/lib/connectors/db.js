'use strict';

const knex = require('./knex');

/**
 * Allows a query to be run with same arguments
 * as pg.pool.query(query, params)
 * The query and params are altered to make them
 * compatible with knex.raw
 *
 * @param {String} query - bound params are specified as $1, $2 etc.
 * @param {Array} [params] - array params
 * @return {Promise<Object>} query result
 */
const query = (query, params = []) => {
  if (params.length === 0) {
    return knex.knex.raw(query);
  }

  const data = params.reduce((acc, param, i) => {
    acc.params[`param_${i}`] = param;
    acc.query = acc.query.replace(`$${i + 1}`, `:param_${i}`);
    return acc;
  }, { query, params: {} });

  return knex.knex.raw(data.query, data.params);
};

exports.pool = {
  query
};
