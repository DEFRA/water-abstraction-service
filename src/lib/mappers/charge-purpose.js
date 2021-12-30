'use strict';

const { createMapper } = require('../object-mapper');

const ChargePurpose = require('../models/charge-purpose');
const DateRange = require('../models/date-range');
const camelCaseKeys = require('../camel-case-keys');
const purposePrimaryMapper = require('./purpose-primary');
const purposeSecondaryMapper = require('./purpose-secondary');
const purposeUseMapper = require('./purpose-use');
const abstractionPeriodMapper = require('./abstraction-period');
const dateRangeMapper = require('./date-range');
const helpers = require('./lib/helpers');

const timeLimitedDateMapper = (startDate, endDate) =>
  new DateRange(startDate, endDate);

const dbToModelMapper = createMapper()
  .map('chargePurposeId').to('id')
  .copy(
    'source',
    'season',
    'loss',
    'authorisedAnnualQuantity',
    'billableAnnualQuantity',
    'description',
    'chargeVersionId',
    'isSection127AgreementEnabled'
  )
  .map().to('abstractionPeriod', abstractionPeriodMapper.dbToModel)
  .map('factorsOverridden').to('isFactorsOverridden')
  .map('purposePrimary').to('purposePrimary', purposePrimaryMapper.dbToModel)
  .map('purposeSecondary').to('purposeSecondary', purposeSecondaryMapper.dbToModel)
  .map('purposeUse').to('purposeUse', purposeUseMapper.dbToModel)
  .map(['timeLimitedStartDate', 'timeLimitedEndDate']).to('timeLimitedPeriod', timeLimitedDateMapper, { mapNull: false });

/**
 * Creates a ChargePurpose instance given a row of charge element data
 * @param {Object} row - charge element row from the charge processor
 * @return {ChargePurpose}
 */
const dbToModel = row =>
  helpers.createModel(ChargePurpose, camelCaseKeys(row), dbToModelMapper);

const pojoToModelMapper = createMapper()
  .copy(
    'id',
    'authorisedAnnualQuantity',
    'billableAnnualQuantity',
    'source',
    'season',
    'loss',
    'description',
    'isSection127AgreementEnabled'
  )
  .map('abstractionPeriod').to('abstractionPeriod', abstractionPeriodMapper.pojoToModel)
  .map('purposePrimary').to('purposePrimary', purposePrimaryMapper.pojoToModel)
  .map('purposeSecondary').to('purposeSecondary', purposeSecondaryMapper.pojoToModel)
  .map('purposeUse').to('purposeUse', purposeUseMapper.pojoToModel)
  .map('timeLimitedPeriod').to('timeLimitedPeriod', dateRangeMapper.pojoToModel);

/**
 * Converts a plain object representation of a ChargePurpose to a ChargePurpose model
 * @param {Object} pojo
 * @return ChargePurpose
 */
const pojoToModel = pojo => {
  return helpers.createModel(ChargePurpose, pojo, pojoToModelMapper);
};

/**
 * Maps charge element to DB fields
 * @param {ChargeElement} chargeElement
 * @param {ChargeVersion} [chargeVersion]
 * @return {Object}
 */

const modelToDbMapper = createMapper()
  .map('id').to('chargePurposeId')
  .copy(
    'source',
    'season',
    'loss',
    'description',
    'authorisedAnnualQuantity',
    'billableAnnualQuantity',
    'isSection127AgreementEnabled'
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

const chargeElementMapper = createMapper()
  .map('id').to('chargeElementId');

const modelToDb = (chargePurpose, chargeElement) => ({
  ...modelToDbMapper.execute(chargePurpose),
  ...chargeElementMapper.execute(chargeElement)
});

exports.dbToModel = dbToModel;
exports.pojoToModel = pojoToModel;
exports.modelToDb = modelToDb;
