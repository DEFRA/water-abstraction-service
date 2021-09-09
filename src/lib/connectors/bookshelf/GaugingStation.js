'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('GaugingStation', {
  tableName: 'water.gauging_stations',
  idAttribute: 'gauging_station_id',
  hasTimestamps: ['date_created', 'date_updated']
});
