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

const query = async (queryString, params) => {
  try {
    const result = await pool.query(queryString, params);
    return { data: result.rows, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

exports.query = query;
exports.pool = pool;
