/**
 * Create message queue
 * @see {@link https://github.com/timgit/pg-boss/blob/master/docs/usage.md#start}
 */
const PgBoss = require('pg-boss');

const Joi = require('joi');
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

const jobContainerSchema = Joi.object({
  job: Joi.object({
    createMessage: Joi.func().required(),
    jobName: Joi.string().required(),
    options: Joi.object().optional(),
    handler: Joi.func().required()
  }),
  onCompleteHandler: Joi.alternatives(
    Joi.func(),
    Joi.object({
      handler: Joi.func(),
      options: Joi.object().optional()
    })
  ).optional()
});

const getOnCompleteHandler = jobContainer => {
  const { onCompleteHandler } = jobContainer;
  return onCompleteHandler.handler || onCompleteHandler;
};

/**
 * Creates a subscription using a standard pattern
 * @param {Object} server - HAPI server instance
 * @param {Object} jobContainer
 */
const createSubscription = async (messageQueue, jobContainer) => {
  Joi.assert(jobContainer, jobContainerSchema);

  const { job, onCompleteHandler } = jobContainer;

  await messageQueue.subscribe(
    job.jobName,
    job.options || {},
    job.handler
  );

  if (onCompleteHandler) {
    const options = onCompleteHandler.options || {};
    const handler = getOnCompleteHandler(jobContainer);

    await messageQueue.onComplete(
      job.jobName,
      options,
      job => handler(job, messageQueue)
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
      return createSubscription(server.messageQueue, jobContainer);
    });
    server.decorate('request', 'messageQueue', boss);
  }
};
module.exports.createSubscription = createSubscription;
