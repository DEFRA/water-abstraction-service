/**
 * Picklists for AR data
 */
const HAPIRestAPI = require('@envage/hapi-pg-rest-api');
const Joi = require('joi');
const { pool } = require('../lib/connectors/db.js');

const PicklistAPI = new HAPIRestAPI({
  table: 'water.picklists',
  primaryKey: 'picklist_id',
  endpoint: '/water/1.0/picklists',
  onCreateTimestamp: 'created',
  onUpdateTimestamp: 'modified',
  connection: pool,
  primaryKeyGuid: false,
  primaryKeyAuto: false,
  validation: {
    picklist_id: Joi.string(),
    name: Joi.string(),
    id_required: Joi.boolean()
  }
});

module.exports = PicklistAPI.getRoutes();
