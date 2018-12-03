/**
 * Lookup data - e.g. for pick lists of NALD data
 */
const HAPIRestAPI = require('@envage/hapi-pg-rest-api');
const Joi = require('joi');
const { pool } = require('../lib/connectors/db.js');

const LookupApi = new HAPIRestAPI({
  table: 'water.lookup',
  primaryKey: 'lookup_id',
  endpoint: '/water/1.0/lookup',
  onCreateTimestamp: 'created',
  onUpdateTimestamp: 'modified',
  connection: pool,
  primaryKeyGuid: true,
  upsert: {
    fields: ['type', 'key'],
    set: ['value']
  },
  validation: {
    lookup_id: Joi.string().guid(),
    type: Joi.string(),
    key: Joi.string(),
    value: Joi.string()
  }
});

module.exports = LookupApi.getRoutes();
