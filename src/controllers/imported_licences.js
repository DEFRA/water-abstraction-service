/**
 * Scheduler
 * Scheduler defines and reports on tasks
 */
const HAPIRestAPI = require('hapi-pg-rest-api');
const Joi = require('joi');
const {pool} = require('../lib/connectors/db.js');

const NotificationsApi = new HAPIRestAPI({
  table : 'water.pending_import',
  primaryKey : 'id',
  endpoint : '/water/1.0/pending_import',
  connection : pool,
  primaryKeyAuto : true,
  primaryKeyGuid : false,
  upsert : {
    fields : ['licence_ref'],
    set : ['status']
  },
  validation : {
    id : Joi.number(),
    licence_ref : Joi.string(),
    status : Joi.number()
  }
});




module.exports = NotificationsApi.getRoutes();
