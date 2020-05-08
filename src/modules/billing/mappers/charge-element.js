'use strict';

const ChargeElement = require('../../../lib/models/charge-element');
const DateRange = require('../../../lib/models/date-range');
const camelCaseKeys = require('../../../lib/camel-case-keys');

const purpose = require('./purpose');

const AbstractionPeriod = require('../../../lib/models/abstraction-period');

/**
 * Creates an AbstractionPeriod instance from camel-cased charge element data
 * @param {Object} chargeElementRow - charge element row from the charge processor
 * @return {AbstractionPeriod}
 */
const mapAbstractionPeriod = chargeElementRow => {
  const element = new AbstractionPeriod();
  return element.fromHash({
    startDay: chargeElementRow.abstractionPeriodStartDay,
    startMonth: chargeElementRow.abstractionPeriodStartMonth,
    endDay: chargeElementRow.abstractionPeriodEndDay,
    endMonth: chargeElementRow.abstractionPeriodEndMonth
  });
};

/**
 * Creates a ChargeElement instance given a row of charge element data
 * @param {Object} chargeElementRow - charge element row from the charge processor
 * @return {ChargeElement}
 */
const dbToModel = row => {
  const chargeElementRow = camelCaseKeys(row);
  const element = new ChargeElement();
  element.fromHash({
    id: chargeElementRow.chargeElementId,
    source: chargeElementRow.source,
    season: chargeElementRow.season,
    loss: chargeElementRow.loss,
    abstractionPeriod: mapAbstractionPeriod(chargeElementRow),
    authorisedAnnualQuantity: chargeElementRow.authorisedAnnualQuantity,
    billableAnnualQuantity: chargeElementRow.billableAnnualQuantity,
    description: chargeElementRow.description
  });
  if (chargeElementRow.purposeUse) {
    element.purposeUse = purpose.dbToModelUse(chargeElementRow.purposeUse);
  }
  if (chargeElementRow.timeLimitedStartDate || chargeElementRow.timeLimitedEndDate) {
    element.timeLimitedPeriod = new DateRange(
      chargeElementRow.timeLimitedStartDate, chargeElementRow.timeLimitedEndDate);
  }
  return element;
};

exports.dbToModel = dbToModel;
