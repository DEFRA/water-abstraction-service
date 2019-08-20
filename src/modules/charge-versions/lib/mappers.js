const camelCase = require('camelcase');
const { mapKeys } = require('lodash');

const mapRow = row => mapKeys(row, (value, key) => camelCase(key));
const mapRows = rows => rows.map(mapRow);

const filterElementAgreements = (element, agreements) => {
  const { charge_element_id: elementId } = element;
  return agreements.filter(row => row.charge_element_id === elementId);
};

/**
 * Maps a complete charge version with its version, elements and agreements
 * @param  {Object} version   - charge version
 * @param  {Array} elements   - charge elements for this version
 * @param  {Array} agreements - charge agreements for this version
 * @return {Object}
 */
const mapChargeVersion = (version, elements, agreements) => ({
  ...mapRow(version),
  chargeElements: elements.map(element => ({
    ...mapRow(element),
    chargeAgreements: mapRows(filterElementAgreements(element, agreements))
  }))
});

exports.mapRow = mapRow;
exports.mapRows = mapRows;
exports.mapChargeVersion = mapChargeVersion;
