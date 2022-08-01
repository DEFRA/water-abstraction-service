/**
 * Scheduler
 * Scheduler defines and reports on tasks
 */
const HAPIRestAPI = require('@envage/hapi-pg-rest-api')
const Joi = require('joi')
const { pool } = require('../lib/connectors/db.js')

const NotificationsApi = new HAPIRestAPI({
  table: 'water.notify_templates',
  primaryKey: 'message_ref',
  endpoint: '/water/1.0/notify_templates',
  connection: pool,
  primaryKeyAuto: false,
  primaryKeyGuid: false,
  upsert: {
    fields: ['message_ref'],
    set: ['template_id', 'notify_key']
  },
  validation: {
    message_ref: Joi.string(),
    template_id: Joi.string(),
    notify_key: Joi.string(),
    notes: Joi.string()
  }
})

module.exports = NotificationsApi.getRoutes()

module.exports.repository = NotificationsApi.repo
