/**
 * Task config API
 * For setting up notifications, each notification type is stores in the DB
 * as a blob of JSON config data
 */
const HAPIRestAPI = require('@envage/hapi-pg-rest-api');
const Joi = require('joi');
const { pool } = require('../lib/connectors/db.js');

const TaskConfigApi = new HAPIRestAPI({
  table: 'water.task_config',
  primaryKey: 'task_config_id',
  endpoint: '/water/1.0/taskConfig',
  onCreateTimestamp: 'created',
  onUpdateTimestamp: 'modified',
  connection: pool,
  primaryKeyAuto: true,
  primaryKeyGuid: false,
  validation: {
    task_config_id: Joi.number(),
    type: Joi.string(),
    subtype: Joi.string(),
    config: Joi.string(),
    created: Joi.string(),
    modified: Joi.string()
  }
});

module.exports = TaskConfigApi.getRoutes();

module.exports.repository = TaskConfigApi.repo;
