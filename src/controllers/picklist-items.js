/**
 * Picklist items for AR data
 */
const HAPIRestAPI = require('hapi-pg-rest-api');
const Joi = require('joi');
const { pool } = require('../lib/connectors/db.js');

const PicklistItemsAPI = new HAPIRestAPI({
  table: 'water.picklist_items',
  primaryKey: 'picklist_item_id',
  endpoint: '/water/1.0/picklist-items',
  onCreateTimestamp: 'created',
  onUpdateTimestamp: 'modified',
  connection: pool,
  primaryKeyGuid: true,
  validation: {
    picklist_item_id: Joi.string().guid(),
    picklist_id: Joi.string(),
    value: Joi.string(),
    id: Joi.string().allow(null),
    hidden: Joi.boolean().default(false)
  }
});

module.exports = PicklistItemsAPI.getRoutes();
