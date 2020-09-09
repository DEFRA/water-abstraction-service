'use strict';

const ChargeElement = require('../models/charge-element');
const DateRange = require('../models/date-range');
const camelCaseKeys = require('../camel-case-keys');
const purposePrimaryMapper = require('./purpose-primary');
const purposeSecondaryMapper = require('./purpose-secondary');
const purposeUseMapper = require('./purpose-use');
const abstractionPeriodMapper = require('./abstraction-period');
const { isEmpty } = require('lodash');
const createMapper = require('map-factory');
const helpers = require('./lib/helpers');

const mapIfNotEmpty = (model, targetKey, data, mapper) => {
  if (!isEmpty(data)) {
    model[targetKey] = mapper(data);
  }
  return model;
};

const timeLimitedDateMapper = (startDate, endDate) =>
  startDate ? new DateRange(startDate, endDate) : null;

const dbToModelMapper = createMapper()
  .map('chargeElementId').to('id')
  .map('source').to('source')
  .map('season').to('season')
  .map('loss').to('loss')
  .map().to('abstractionPeriod', abstractionPeriodMapper.dbToModel)
  .map('authorisedAnnualQuantity').to('authorisedAnnualQuantity')
  .map('billableAnnualQuantity').to('billableAnnualQuantity')
  .map('description').to('description')
  .map('purposePrimary').to('purposePrimary', purposePrimaryMapper.dbToModel)
  .map('purposeSecondary').to('purposeSecondary', purposeSecondaryMapper.dbToModel)
  .map('purposeUse').to('purposeUse', purposeUseMapper.dbToModel)
  .map(['timeLimitedStartDate', 'timeLimitedEndDate']).to('timeLimitedPeriod', timeLimitedDateMapper);

/**
 * Creates a ChargeElement instance given a row of charge element data
 * @param {Object} chargeElementRow - charge element row from the charge processor
 * @return {ChargeElement}
 */
const dbToModel = row =>
  helpers.createModel(ChargeElement, camelCaseKeys(row), dbToModelMapper);

/**
 * Converts a plain object representation of a ChargeElement to a ChargeElement model
 * @param {Object} pojo
 * @return ChargeElement
 */
const pojoToModel = pojo => {
  const model = new ChargeElement();

  model.pickFrom(pojo, [
    'id',
    'externalId',
    'authorisedAnnualQuantity', 'billableAnnualQuantity',
    'season', 'source', 'loss',
    'description'
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
