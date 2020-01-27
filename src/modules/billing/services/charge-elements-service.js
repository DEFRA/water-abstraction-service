const ChargeElement = require('../../../lib/models/charge-element');
const abstractionPeriodService = require('./abstraction-period-service');
const camelCaseKeys = require('../../../lib/camel-case-keys');
const repos = require('../../../lib/connectors/repository');

/**
 * Creates a ChargeElement instance given a row of charge element data
 * @param {Object} chargeElementRow - charge element row from the charge processor
 * @return {ChargeElement}
 */
const mapRowToModel = chargeElementRow => {
  const element = new ChargeElement();
  element.fromHash({
    id: chargeElementRow.chargeElementId,
    source: chargeElementRow.source,
    season: chargeElementRow.season,
    loss: chargeElementRow.loss,
    abstractionPeriod: abstractionPeriodService.mapRowToModel(chargeElementRow),
    authorisedAnnualQuantity: chargeElementRow.authorisedAnnualQuantity,
    billableAnnualQuantity: chargeElementRow.billableAnnualQuantity
  });
  return element;
};

/**
 * Maps a water.charge_elements DB row to a ChargeElement model
 * @param {Object} row
 * @return {ChargeElement}
 */
const mapDBToModel = row => {
  const data = camelCaseKeys(row);
  return mapRowToModel(data);
};

/**
 * Gets a single charge element model by ID
 * @param {String} chargeElementId - GUID
 * @return {Promise<ChargeElement>}
 */
const getById = async chargeElementId => {
  const data = await repos.chargeElements.findOneById(chargeElementId);
  return mapDBToModel(data);
};

exports.mapRowToModel = mapRowToModel;
exports.mapDBToModel = mapDBToModel;
exports.getById = getById;
