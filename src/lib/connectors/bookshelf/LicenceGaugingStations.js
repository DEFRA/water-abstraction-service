'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('LicenceGaugingStations', {
  tableName: 'water.licence_gauging_stations',
  idAttribute: 'licence_gauging_station_id',
  hasTimestamps: ['date_created', 'date_updated', 'date_deleted']
});
