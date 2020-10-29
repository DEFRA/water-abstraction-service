'use strict';

const BillingVolume = require('../../../lib/models/billing-volume');
const FinancialYear = require('../../../lib/models/financial-year');
const userMapper = require('../../../lib/mappers/user');
const chargeElementMapper = require('../../../lib/mappers/charge-element');
const { createMapper } = require('../../../lib/object-mapper');
const { createModel } = require('../../../lib/mappers/lib/helpers');

const matchingResultsToDb = (matchingResults, financialYear, isSummer, billingBatchId) => {
  const { error: overallError } = matchingResults;
  return matchingResults.data.map(result => {
    const twoPartTariffStatus = overallError || result.error;
    return {
      chargeElementId: result.data.chargeElementId,
      financialYear,
      isSummer,
      calculatedVolume: result.data.actualReturnQuantity,
      volume: result.data.actualReturnQuantity,
      twoPartTariffStatus: twoPartTariffStatus,
      twoPartTariffError: !!twoPartTariffStatus,
      isApproved: false,
      billingBatchId
    };
  });
};

const dbToModelMapper = createMapper()
  .copy(
    'chargeElementId',
    'isSummer',
    'calculatedVolume',
    'twoPartTariffError',
    'twoPartTariffStatus',
    'isApproved',
    'volume',
    'billingBatchId'
  )
  .map('billingVolumeId').to('id')
  .map('financialYear').to('financialYear', financialYear => new FinancialYear(financialYear))
  .map('twoPartTariffReview').to('twoPartTariffReview', userMapper.dbToModel)
  .map('chargeElement').to('chargeElement', chargeElementMapper.dbToModel);

/**
 * Converts a plain object representation of a ChangeReason to a ChangeReason model
 * @param {Object} pojo
 * @return ChangeReason
 */
const dbToModel = pojo => createModel(BillingVolume, pojo, dbToModelMapper);
const modelToDbMapper = createMapper()
  .copy(
    'chargeElementId',
    'isSummer',
    'calculatedVolume',
    'twoPartTariffError',
    'twoPartTariffStatus',
    'isApproved',
    'volume',
    'billingBatchId'
  )
  .map('id').to('billingVolumeId')
  .map('financialYear').to('financialYear', financialYear => financialYear.endYear)
  .map('twoPartTariffReview').to('twoPartTariffReview', userMapper.modelToDb);

const modelToDb = model => modelToDbMapper.execute(model);

exports.dbToModel = dbToModel;
exports.matchingResultsToDb = matchingResultsToDb;
exports.modelToDb = modelToDb;
