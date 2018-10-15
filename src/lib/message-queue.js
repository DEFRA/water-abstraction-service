/**
 * Create message queue
 * @see {@link https://github.com/timgit/pg-boss/blob/master/docs/usage.md#start}
 */
const server = require('../../');

const PgBoss = require('pg-boss');
const config = require('../../config.js');

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
  server.log('error', error);
});

module.exports = boss;
