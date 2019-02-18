require('dotenv').config();
const config = require('../../../config.js');
const { Pool } = require('pg');
const { logger } = require('@envage/water-abstraction-helpers');

const pool = new Pool(config.pg);

pool.on('acquire', () => {
  const { totalCount, idleCount, waitingCount } = pool;
  if (totalCount === config.pg.max && idleCount === 0 && waitingCount > 0) {
    logger.info(`Pool low on connections::Total:${totalCount},Idle:${idleCount},Waiting:${waitingCount}`);
  }
});

function promiseQuery (queryString, params) {
  return new Promise((resolve, reject) => {
    query(queryString, params, (res) => {
      resolve(res);
    });
  });
}

function query (queryString, params, cb) {
  pool.query(queryString, params)
    .then((res) => {
      cb({data: res.rows, error: null});
    })
    .catch(err => {
      cb({error: err.stack, data: null});
    });
}

module.exports = {
  query: promiseQuery,
  pool
};
