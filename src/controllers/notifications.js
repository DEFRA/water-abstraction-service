/**
 * Scheduler
 * Scheduler defines and reports on tasks
 */
const HAPIRestAPI = require('hapi-pg-rest-api');
const Joi = require('joi');
const {pool} = require('../lib/connectors/db.js');

const NotificationsApi = new HAPIRestAPI({
  table : 'water.scheduled_notification',
  primaryKey : 'id',
  endpoint : '/water/1.0/notification',
  onCreateTimestamp : 'date_created',
  onUpdateTimestamp : 'date_updated',
  connection : pool,
  primaryKeyAuto : true,
  primaryKeyGuid : false,
  upsert : {
    fields : ['id'],
    set : []
  },
  validation : {
    id : Joi.string(),
    recipient : Joi.string(),
    message_ref : Joi.string(),
    personalisation: Joi.object(),
    send_after: Joi.string()
  }
});




module.exports = NotificationsApi.getRoutes();
