const gaugingStationsCSVHeaders = [
  'hydrology_station_id',
  'station_reference',
  'wiski_id',
  'label',
  'lat',
  'long',
  'easting',
  'northing',
  'grid_reference',
  'catchment_name',
  'river_name'
];

const getArraysFromCSV = Body => Body.toString()
  .split('\n') // split string to lines
  .map(e => e.trim()) // remove white spaces for each line
  .map(f => f.split(',')
    .map(g => g.trim())); // split each line to a sub-array

exports.gaugingStationsCSVHeaders = gaugingStationsCSVHeaders;
exports.getArraysFromCSV = getArraysFromCSV;
