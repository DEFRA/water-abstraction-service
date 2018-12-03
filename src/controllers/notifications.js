/**
 * Scheduler
 * Scheduler defines and reports on tasks
 */
const HAPIRestAPI = require('@envage/hapi-pg-rest-api');
const Joi = require('joi');
const { pool } = require('../lib/connectors/db.js');
const uuidv4 = require('uuid/v4');

const NotificationsApi = new HAPIRestAPI({
  table: 'water.scheduled_notification',
  primaryKey: 'id',
  endpoint: '/water/1.0/notification',
  connection: pool,
  primaryKeyAuto: false,
  primaryKeyGuid: false,
  upsert: {
    fields: ['id'],
    set: ['id']
  },
  showSql: true,
  validation: {
    id: Joi.string().guid().default(() => uuidv4(), 'GUID'),
    recipient: Joi.string(),
    message_ref: Joi.string(),
    personalisation: Joi.object(),
    send_after: Joi.string(),
    message_type: Joi.string(),
    status: Joi.string(),
    log: Joi.string(),
    event_id: Joi.string().guid(),
    licences: Joi.array(),
    individual_entity_id: Joi.array(),
    company_entity_id: Joi.array()

  }
});

module.exports = NotificationsApi.getRoutes();

module.exports.repository = NotificationsApi.repo;
