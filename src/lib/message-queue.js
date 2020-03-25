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

const createSubscription = async (messageQueue, jobContainer) => {
  const { job: billingJob, onCompleteHandler } = jobContainer;

  await messageQueue.subscribe(
    billingJob.jobName,
    billingJob.options || {},
    billingJob.handler

  );

  if (onCompleteHandler) {
    await messageQueue.onComplete(
      billingJob.jobName,
      job => onCompleteHandler(job, messageQueue)
    );
  }
};

module.exports = boss;
module.exports.plugin = {
  name: 'hapiPgBoss',
  register: async server => {
    await boss.start();
    server.decorate('server', 'messageQueue', boss);
    server.decorate('server', 'createSubscription', jobContainer => {
      return createSubscription(boss, jobContainer);
    });
    server.decorate('request', 'messageQueue', boss);
  }
};
