const csvParser = require('./csv-parser');
const { camelCase } = require('lodash');

/**
 * Maps a CSV file in string form to an array of return objects
 * @param  {String}  csvStr - CSV file in string form
 * @return {Promise<Array>} resolves with array of return objects
 */
const mapCsv = async csvStr => {
  const data = await csvParser.parseCsv(csvStr);

  const [headers, ...rows] = data;
  const colHeaders = headers.map(header => camelCase(header));

  return rows.map(row => row.reduce((acc, column, index) => ({ ...acc, [colHeaders[index]]: column }), {}));
};

exports.mapCsv = mapCsv;
