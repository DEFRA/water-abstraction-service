/**
 * Session storage
 * Session data is a JSON encoded string
 */
const HAPIRestAPI = require('hapi-pg-rest-api');
const Joi = require('joi');
const {pool} = require('../lib/connectors/db.js');

const SessionsApi = new HAPIRestAPI({
  table: 'water.sessions',
  primaryKey: 'session_id',
  endpoint: '/water/1.0/sessions',
  onCreateTimestamp: 'date_created',
  onUpdateTimestamp: 'date_updated',
  connection: pool,
  validation: {
    session_id: Joi.string().guid(),
    ip: Joi.string(),
    session_data: Joi.string(),
    date_created: Joi.string(),
    date_updated: Joi.string()
  }
});

module.exports = SessionsApi.getRoutes();
