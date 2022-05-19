/* eslint-disable camelcase */
'use strict'

const { createMapper } = require('../object-mapper')
const helpers = require('./lib/helpers')

const GaugingStation = require('../models/gauging-station')

const csvToModel = data => {
  const gaugingStation = new GaugingStation()

  const {
    hydrology_station_id,
    station_reference,
    wiski_id,
    label,
    lat,
    long,
    easting,
    northing,
    grid_reference,
    catchment_name,
    river_name
  } = data
  const hydrologyStationId = hydrology_station_id && hydrology_station_id.length === 36 ? hydrology_station_id : null

  return gaugingStation.fromHash({
    hydrologyStationId,
    stationReference: station_reference,
    wiskiId: wiski_id,
    label: label || 'Unnamed Gauging Station',
    lat: parseFloat(lat) || null,
    long: parseFloat(long) || null,
    easting: parseFloat(easting) || null,
    northing: parseFloat(northing) || null,
    gridReference: grid_reference,
    catchmentName: catchment_name,
    riverName: river_name
  })
}

/* Humanize and copy fields */
const dbToModelMapper = createMapper()
  .map('gauging_station_id').to('gaugingStationId')
  .map('hydrology_station_id').to('hydrologyStationId')
  .map('wiski_id').to('wiskiId')
  .map('grid_reference').to('gridReference')
  .map('catchment_name').to('catchmentName')
  .map('river_name').to('riverName')
  .map('station_reference').to('stationReference')
  .copy(
    'gaugingStationId',
    'hydrologyStationId',
    'wiskiId',
    'gridReference',
    'catchmentName',
    'riverName',
    'stationReference',
    'label',
    'lat',
    'long',
    'easting',
    'northing',
    'status',
    'metadata',
    'dateCreated',
    'dateUpdated'
  )

const dbToModel = row => helpers.createModel(GaugingStation, row, dbToModelMapper)

exports.dbToModel = dbToModel
exports.csvToModel = csvToModel
