'use strict';

const ChargeElement = require('../models/charge-element');
const DateRange = require('../models/date-range');
const camelCaseKeys = require('../camel-case-keys');
const purposePrimaryMapper = require('./purpose-primary');
const purposeSecondaryMapper = require('./purpose-secondary');
const purposeUseMapper = require('./purpose-use');
const abstractionPeriodMapper = require('./abstraction-period');
const { isEmpty } = require('lodash');

const mapIfNotEmpty = (model, targetKey, data, mapper) => {
  if (!isEmpty(data)) {
    model[targetKey] = mapper(data);
  }
  return model;
};

/**
 * Creates a ChargeElement instance given a row of charge element data
 * @param {Object} chargeElementRow - charge element row from the charge processor
 * @return {ChargeElement}
 */
const dbToModel = row => {
  const chargeElementRow = camelCaseKeys(row);
  const model = new ChargeElement();
  model.fromHash({
    id: chargeElementRow.chargeElementId,
    source: chargeElementRow.source,
    season: chargeElementRow.season,
    loss: chargeElementRow.loss,
    abstractionPeriod: abstractionPeriodMapper.dbToModel(chargeElementRow),
    authorisedAnnualQuantity: chargeElementRow.authorisedAnnualQuantity,
    billableAnnualQuantity: chargeElementRow.billableAnnualQuantity
  });

  if (chargeElementRow.description) {
    model.description = chargeElementRow.description;
  }

  mapIfNotEmpty(model, 'purposePrimary', chargeElementRow.purposePrimary, purposePrimaryMapper.dbToModel);
  mapIfNotEmpty(model, 'purposeSecondary', chargeElementRow.purposeSecondary, purposeSecondaryMapper.dbToModel);
  mapIfNotEmpty(model, 'purposeUse', chargeElementRow.purposeUse, purposeUseMapper.dbToModel);

  if (chargeElementRow.timeLimitedStartDate && chargeElementRow.timeLimitedEndDate) {
    model.timeLimitedPeriod = new DateRange(
      chargeElementRow.timeLimitedStartDate, chargeElementRow.timeLimitedEndDate);
  }

  return model;
};

/**
 * Converts a plain object representation of a ChargeElement to a ChargeElement model
 * @param {Object} pojo
 * @return ChargeElement
 */
const pojoToModel = pojo => {
  const model = new ChargeElement();

  model.pickFrom(pojo, [
    'externalId', 'authorisedAnnualQuantity', 'billableAnnualQuantity', 'season', 'source', 'loss', 'description'
  ]);

  if (pojo.abstractionPeriod) {
    model.abstractionPeriod = abstractionPeriodMapper.pojoToModel(pojo.abstractionPeriod);
  }

  mapIfNotEmpty(model, 'purposePrimary', pojo.purposePrimary, purposePrimaryMapper.pojoToModel);
  mapIfNotEmpty(model, 'purposeSecondary', pojo.purposeSecondary, purposeSecondaryMapper.pojoToModel);
  mapIfNotEmpty(model, 'purposeUse', pojo.purposeUse, purposeUseMapper.pojoToModel);

  return model;
};

/**
 * Maps charge element to DB fields
 * @param {ChargeElement} chargeElement
 * @param {ChargeVersion} [chargeVersion]
 * @return {Object}
 */
const modelToDb = (chargeElement, chargeVersion) => ({
  chargeElementId: chargeElement.id,
  ...chargeElement.pick('source', 'season', 'loss', 'description', 'authorisedAnnualQuantity', 'billableAnnualQuantity'),
  ...abstractionPeriodMapper.modelToDb(chargeElement.abstractionPeriod),
  purposePrimaryId: chargeElement.purposePrimary.id,
  purposeSecondaryId: chargeElement.purposeSecondary.id,
  purposeUseId: chargeElement.purposeUse.id,
  timeLimitedStartDate: chargeElement.timeLimitedPeriod ? chargeElement.timeLimitedPeriod.startDate : null,
  timeLimitedEndDate: chargeElement.timeLimitedPeriod ? chargeElement.timeLimitedPeriod.endDate : null,
  ...chargeVersion && { chargeVersionId: chargeVersion.id },
  seasonDerived: chargeElement.abstractionPeriod.getChargeSeason()
});

exports.dbToModel = dbToModel;
exports.pojoToModel = pojoToModel;
exports.modelToDb = modelToDb;
