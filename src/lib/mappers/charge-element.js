'use strict';

const { createMapper } = require('../object-mapper');

const ChargeElement = require('../models/charge-element');
const DateRange = require('../models/date-range');
const camelCaseKeys = require('../camel-case-keys');
const purposePrimaryMapper = require('./purpose-primary');
const purposeSecondaryMapper = require('./purpose-secondary');
const purposeUseMapper = require('./purpose-use');
const abstractionPeriodMapper = require('./abstraction-period');
const helpers = require('./lib/helpers');

const timeLimitedDateMapper = (startDate, endDate) =>
  new DateRange(startDate, endDate);

const dbToModelMapper = createMapper()
  .map('chargeElementId').to('id')
  .copy(
    'source',
    'season',
    'loss',
    'authorisedAnnualQuantity',
    'billableAnnualQuantity',
    'description',
    'chargeVersionId'
  )
  .map().to('abstractionPeriod', abstractionPeriodMapper.dbToModel)
  .map('factorsOverridden').to('isFactorsOverridden', factorsOverridden => factorsOverridden)
  .map('purposePrimary').to('purposePrimary', purposePrimaryMapper.dbToModel)
  .map('purposeSecondary').to('purposeSecondary', purposeSecondaryMapper.dbToModel)
  .map('purposeUse').to('purposeUse', purposeUseMapper.dbToModel)
  .map(['timeLimitedStartDate', 'timeLimitedEndDate']).to('timeLimitedPeriod', timeLimitedDateMapper, { mapNull: false });

/**
 * Creates a ChargeElement instance given a row of charge element data
 * @param {Object} chargeElementRow - charge element row from the charge processor
 * @return {ChargeElement}
 */
const dbToModel = row =>
  helpers.createModel(ChargeElement, camelCaseKeys(row), dbToModelMapper);

const pojoToModelMapper = createMapper()
  .copy(
    'id',
    'externalId',
    'authorisedAnnualQuantity',
    'billableAnnualQuantity',
    'source',
    'season',
    'loss',
    'description'
  )
  .map('abstractionPeriod').to('abstractionPeriod', abstractionPeriodMapper.pojoToModel)
  .map('purposePrimary').to('purposePrimary', purposePrimaryMapper.pojoToModel)
  .map('purposeSecondary').to('purposeSecondary', purposeSecondaryMapper.pojoToModel)
  .map('purposeUse').to('purposeUse', purposeUseMapper.pojoToModel);

/**
 * Converts a plain object representation of a ChargeElement to a ChargeElement model
 * @param {Object} pojo
 * @return ChargeElement
 */
const pojoToModel = pojo =>
  helpers.createModel(ChargeElement, pojo, pojoToModelMapper);

/**
 * Maps charge element to DB fields
 * @param {ChargeElement} chargeElement
 * @param {ChargeVersion} [chargeVersion]
 * @return {Object}
 */

const modelToDbMapper = createMapper()
  .map('id').to('chargeElementId')
  .copy(
    'source',
    'season',
    'loss',
    'description',
    'authorisedAnnualQuantity',
    'billableAnnualQuantity'
  )
  .map('abstractionPeriod.startDay').to('abstractionPeriodStartDay')
  .map('abstractionPeriod.startMonth').to('abstractionPeriodStartMonth')
  .map('abstractionPeriod.endDay').to('abstractionPeriodEndDay')
  .map('abstractionPeriod.endMonth').to('abstractionPeriodEndMonth')
  .map('isFactorsOverridden').to('factorsOverridden')
  .map('purposePrimary.id').to('purposePrimaryId')
  .map('purposeSecondary.id').to('purposeSecondaryId')
  .map('purposeUse.id').to('purposeUseId')
  .map('timeLimitedPeriod').to('timeLimitedStartDate', value => value ? value.startDate : null)
  .map('timeLimitedPeriod').to('timeLimitedEndDate', value => value ? value.endDate : null)
  .map('abstractionPeriod').to('seasonDerived', abstractionPeriod => abstractionPeriod.getChargeSeason());

const chargeVersionMapper = createMapper()
  .map('id').to('chargeVersionId');

const modelToDb = (chargeElement, chargeVersion) => ({
  ...modelToDbMapper.execute(chargeElement),
  ...chargeVersionMapper.execute(chargeVersion)
});

exports.dbToModel = dbToModel;
exports.pojoToModel = pojoToModel;
exports.modelToDb = modelToDb;
