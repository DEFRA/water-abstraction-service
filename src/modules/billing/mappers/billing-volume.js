'use strict';

const { pick, isNull } = require('lodash');
const Decimal = require('decimal.js-light');

const BillingVolume = require('../../../lib/models/billing-volume');
const FinancialYear = require('../../../lib/models/financial-year');
const userMapper = require('../../../lib/mappers/user');
const chargeElementMapper = require('../../../lib/mappers/charge-element');

const dbToModel = row => {
  const billingVolume = new BillingVolume();
  billingVolume.fromHash({
    id: row.billingVolumeId,
    ...pick(row, ['chargeElementId', 'isSummer', 'twoPartTariffError',
      'twoPartTariffStatus', 'isApproved', 'volume']),
    financialYear: new FinancialYear(row.financialYear),
    twoPartTariffReview: userMapper.dbToModel(row.twoPartTariffReview),
    calculatedVolume: isNull(row.calculatedVolume) ? null : new Decimal(row.calculatedVolume)
  });
  if (row.chargeElement) {
    billingVolume.chargeElement = chargeElementMapper.dbToModel(row.chargeElement);
  }
  return billingVolume;
};

const modelToDB = billingVolume => {
  const twoPartTariffReview = billingVolume.twoPartTariffReview ? billingVolume.twoPartTariffReview.toJSON() : null;
  return {
    billingVolumeId: billingVolume.id,
    ...billingVolume.pick(['billingBatchId', 'chargeElementId', 'isSummer', 'twoPartTariffError', 'twoPartTariffStatus', 'isApproved', 'volume', 'calculatedVolume']),
    financialYear: billingVolume.financialYear.endYear,
    twoPartTariffReview
  };
};

exports.dbToModel = dbToModel;
exports.modelToDB = modelToDB;
