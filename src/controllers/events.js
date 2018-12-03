/**
 * Scheduler
 * Scheduler defines and reports on tasks
 */
const HAPIRestAPI = require('@envage/hapi-pg-rest-api');
const Joi = require('joi');
const { pool } = require('../lib/connectors/db.js');

const EventsApi = new HAPIRestAPI({
  table: 'water.events',
  primaryKey: 'event_id',
  endpoint: '/water/1.0/event',
  connection: pool,
  primaryKeyAuto: false,
  primaryKeyGuid: true,
  upsert: {
    fields: ['event_id'],
    set: [
      'reference_code', 'type', 'subtype', 'issuer', 'licences', 'entities',
      'comment', 'metadata', 'status'
    ]
  },
  onCreateTimestamp: 'created',
  onUpdateTimestamp: 'modified',
  validation: {
    event_id: Joi.string(),
    reference_code: Joi.string(),
    type: Joi.string(),
    subtype: Joi.string(),
    issuer: Joi.string(),
    licences: Joi.array(),
    entities: Joi.array(),
    comment: Joi.string(),
    metadata: Joi.object(),
    status: Joi.string()
  }
});

module.exports = EventsApi.getRoutes();

module.exports.repository = EventsApi.repo;
