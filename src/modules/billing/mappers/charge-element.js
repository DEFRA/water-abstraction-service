'use strict';

const ChargeElement = require('../../../lib/models/charge-element');
const abstractionPeriod = require('./abstraction-period');
const camelCaseKeys = require('../../../lib/camel-case-keys');

const purpose = require('./purpose');

/**
 * Creates a ChargeElement instance given a row of charge element data
 * @param {Object} chargeElementRow - charge element row from the charge processor
 * @return {ChargeElement}
 */
const chargeToModel = chargeElementRow => {
  const element = new ChargeElement();
  element.fromHash({
    id: chargeElementRow.chargeElementId,
    source: chargeElementRow.source,
    season: chargeElementRow.season,
    loss: chargeElementRow.loss,
    abstractionPeriod: abstractionPeriod.chargeToModel(chargeElementRow),
    authorisedAnnualQuantity: chargeElementRow.authorisedAnnualQuantity,
    billableAnnualQuantity: chargeElementRow.billableAnnualQuantity,
    description: chargeElementRow.description
  });
  if (chargeElementRow.purposeUse) {
    element.purposeUse = purpose.dbToModelUse(chargeElementRow.purposeUse);
  }
  return element;
};

/**
 * Maps a water.charge_elements DB row to a ChargeElement model
 * @param {Object} row
 * @return {ChargeElement}
 */
const dbToModel = row => {
  const data = camelCaseKeys(row);
  return chargeToModel(data);
};

exports.chargeToModel = chargeToModel;
exports.dbToModel = dbToModel;
