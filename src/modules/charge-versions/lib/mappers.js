const camelCase = require('camelcase');
const { mapKeys } = require('lodash');

const mapRow = row => mapKeys(row, (value, key) => camelCase(key));
const mapRows = rows => rows.map(mapRow);

/**
 * Filters the agreements to a list which only contains those that belong
 * to the supplied element
 * @param  {Object} element    - charge element
 * @param  {Array} agreements  - charge agreements
 * @return {Array}             - filtered list of charge agreements
 */
const filterElementAgreements = (element, agreements) => {
  const { charge_element_id: elementId } = element;
  return agreements.filter(row => row.charge_element_id === elementId);
};

const eiucSourceMap = {
  unsupported: 'other',
  supported: 'other',
  kielder: 'other',
  tidal: 'tidal'
};

const mapElement = element => ({
  ...mapRow(element),
  eiucSource: eiucSourceMap[element.source]
});

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
    ...mapElement(element),
    chargeAgreements: mapRows(filterElementAgreements(element, agreements))
  }))
});

exports.mapRow = mapRow;
exports.mapRows = mapRows;
exports.mapElement = mapElement;
exports.mapChargeVersion = mapChargeVersion;
