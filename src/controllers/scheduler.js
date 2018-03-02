/**
 * Scheduler
 * Scheduler defines and reports on tasks
 */
const HAPIRestAPI = require('hapi-pg-rest-api');
const Joi = require('joi');
const {pool} = require('../lib/connectors/db.js');

const SchedulerApi = new HAPIRestAPI({
  table : 'water.scheduler',
  primaryKey : 'task_id',
  endpoint : '/water/1.0/scheduler',
  onCreateTimestamp : 'date_created',
  onUpdateTimestamp : 'date_updated',
  connection : pool,
  primaryKeyAuto : true,
  primaryKeyGuid : false,
  upsert : {
    fields : ['task_type', 'licence_ref'],
    set : ['task_config']
  },
  validation : {
    task_id : Joi.number(),
    task_type : Joi.string(),
    licence_ref : Joi.string(),
    task_config: Joi.string(),
    next_run: Joi.string(),
    last_run: Joi.string(),
    log : Joi.string(),
    status : Joi.number(),
    running: Joi.number(),
    date_created : Joi.string(),
    date_updated : Joi.string(),
    running_on : Joi.string(),
  }
});




module.exports = SchedulerApi.getRoutes();
