'use strict';

const { pick } = require('lodash');
const BillingVolume = require('../../../lib/models/billing-volume');
const FinancialYear = require('../../../lib/models/financial-year');
const userMapper = require('../../../lib/mappers/user');
const chargeElementMapper = require('../../../lib/mappers/charge-element');

const dbToModel = row => {
  const billingVolume = new BillingVolume();
  billingVolume.fromHash({
    id: row.billingVolumeId,
    ...pick(row, ['chargeElementId', 'isSummer', 'calculatedVolume', 'twoPartTariffError',
      'twoPartTariffStatus', 'isApproved', 'volume']),
    financialYear: new FinancialYear(row.financialYear),
    twoPartTariffReview: userMapper.dbToModel(row.twoPartTariffReview)
  });
  if (row.chargeElement) {
    billingVolume.chargeElement = chargeElementMapper.dbToModel(row.chargeElement);
  }
  return billingVolume;
};

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

const modelToDB = billingVolume => {
  const twoPartTariffReview = billingVolume.twoPartTariffReview ? billingVolume.twoPartTariffReview.toJSON() : null;
  return {
    billingVolumeId: billingVolume.id,
    ...billingVolume.pick(['billingBatchId', 'chargeElementId', 'isSummer', 'calculatedVolume', 'twoPartTariffError', 'twoPartTariffStatus', 'isApproved', 'volume']),
    financialYear: billingVolume.financialYear.endYear,
    twoPartTariffReview
  };
};

exports.dbToModel = dbToModel;
exports.matchingResultsToDb = matchingResultsToDb;
exports.modelToDB = modelToDB;
