/**
 * Scheduler
 * Scheduler defines and reports on tasks
 */
const HAPIRestAPI = require('@envage/hapi-pg-rest-api');
const Joi = require('joi');
const { pool } = require('../lib/connectors/db.js');

const GaugingStationsApi = new HAPIRestAPI({
  table: 'water.gauging_stations',
  primaryKey: 'id',
  endpoint: '/water/1.0/gaugingStations',
  connection: pool,
  primaryKeyAuto: false,
  primaryKeyGuid: false,
  onCreateTimestamp: 'created',
  onUpdateTimestamp: 'modified',
  upsert: {
    fields: ['id'],
    set: ['label', 'lat', 'long', 'easting', 'northing', 'grid_reference', 'catchment_name', 'river_name', 'wiski_id', 'station_reference', 'status', 'metadata', 'modified']
  },
  validation: {
    id: Joi.string(),
    label: Joi.string(),
    lat: Joi.number(),
    long: Joi.number(),
    easting: Joi.number(),
    northing: Joi.number(),
    grid_reference: Joi.string(),
    catchment_name: Joi.string(),
    river_name: Joi.string(),
    wiski_id: Joi.string(),
    station_reference: Joi.string(),
    status: Joi.string(),
    metadata: Joi.string(),
    created: Joi.string(),
    modified: Joi.string()
  }
});

module.exports = GaugingStationsApi.getRoutes();

module.exports.repository = GaugingStationsApi.repo;
