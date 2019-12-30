const ChargeElement = require('../../../lib/models/charge-element');
const abstractionPeriodService = require('./abstraction-period-service');

/**
 * Creates a ChargeElement instance given a row of charge element data
 * @param {Object} chargeElementRow - charge element row from the charge processor
 * @return {ChargeElement>}
 */
const mapRowToModel = chargeElementRow => {
  const element = new ChargeElement();
  element.fromHash({
    id: chargeElementRow.chargeElementId,
    source: chargeElementRow.source,
    season: chargeElementRow.season,
    loss: chargeElementRow.loss,
    abstractionPeriod: abstractionPeriodService.mapRowToModel(chargeElementRow)
  });
  return element;
};

exports.mapRowToModel = mapRowToModel;
