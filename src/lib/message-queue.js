/**
 * Create message queue
 * @see {@link https://github.com/timgit/pg-boss/blob/master/docs/usage.md#start}
 */
const PgBoss = require('pg-boss');
const config = require('../../config.js');
const { logger } = require('../logger');
const { pool } = require('./connectors/db');
const Joi = require('@hapi/joi');

const registerSubscriberSchema = Joi.array().items({
  method: Joi.string().valid('subscribe', 'onComplete').required(),
  name: Joi.string().required(),
  options: Joi.object().optional(),
  handler: Joi.func().required()
});

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

const registerSubscribers = async (messageQueue, arr = []) => {
  Joi.assert(arr, registerSubscriberSchema);
  const tasks = arr.map(row =>
    messageQueue[row.method](row.name, row.options, row.handler)
  );
  return Promise.all(tasks);
};

module.exports = boss;
module.exports.plugin = {
  name: 'hapiPgBoss',
  register: async server => {
    await boss.start();
    server.decorate('server', 'messageQueue', boss);
    server.decorate('request', 'messageQueue', boss);
    server.decorate('server', 'registerSubscribers', arr =>
      registerSubscribers(server.messageQueue, arr)
    );
  }
};
