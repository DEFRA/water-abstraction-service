'use strict';

const ChargeElement = require('../models/charge-element');
const DateRange = require('../models/date-range');
const camelCaseKeys = require('../camel-case-keys');

const purposeUseMapper = require('./purpose-use');
const abstractionPeriodMapper = require('./abstraction-period');
const { omit } = require('lodash');

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
    abstractionPeriod: abstractionPeriodMapper.dbToModel(chargeElementRow),
    authorisedAnnualQuantity: chargeElementRow.authorisedAnnualQuantity,
    billableAnnualQuantity: chargeElementRow.billableAnnualQuantity
  });

  if (chargeElementRow.description) {
    element.description = chargeElementRow.description;
  }

  if (chargeElementRow.purposeUse) {
    element.purposeUse = purposeUseMapper.dbToModel(chargeElementRow.purposeUse);
  }

  if (chargeElementRow.timeLimitedStartDate && chargeElementRow.timeLimitedEndDate) {
    element.timeLimitedPeriod = new DateRange(
      chargeElementRow.timeLimitedStartDate, chargeElementRow.timeLimitedEndDate);
  }

  return element;
};

/**
 * Converts a plain object representation of a ChargeElement to a ChargeElement model
 * @param {Object} pojo
 * @return ChargeElement
 */
const pojoToModel = pojo => {
  const { abstractionPeriod, purposeUse, ...rest } = pojo;
  const model = new ChargeElement();
  model.fromHash(omit(rest, 'eiucSource'));

  if (abstractionPeriod) {
    model.abstractionPeriod = abstractionPeriodMapper.pojoToModel(abstractionPeriod);
  }
  if (purposeUse) {
    model.purposeUse = purposeUseMapper.pojoToModel(purposeUse);
  }
  return model;
};

exports.dbToModel = dbToModel;
exports.pojoToModel = pojoToModel;
