/**
 * Create message queue
 * @see {@link https://github.com/timgit/pg-boss/blob/master/docs/usage.md#start}
 */
const PgBoss = require('pg-boss');
const config = require('../../config.js');
const { logger } = require('../logger');
const { pool } = require('./connectors/db');

const db = {
  executeSql: (sql, params) => {
    return pool.query(sql, params);
  }
};

const boss = new PgBoss({
  ...config.pgBoss,
  db
});

boss.on('error', error => {
  logger.error('PG Boss Error', error);
});

module.exports = boss;
module.exports.plugin = {
  name: 'hapiPgBoss',
  register: async server => {
    await boss.start();
    server.decorate('server', 'messageQueue', boss);
    server.decorate('request', 'messageQueue', boss);
  }
};
