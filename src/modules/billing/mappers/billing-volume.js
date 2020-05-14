const { pick } = require('lodash');
const BillingVolume = require('../../../lib/models/billing-volume');
const FinancialYear = require('../../../lib/models/financial-year');
const userMapper = require('./user');

const dbToModel = row => {
  const billingVolume = new BillingVolume();
  return billingVolume.fromHash({
    id: row.billingVolumeId,
    ...pick(row, ['chargeElementId', 'isSummer', 'calculatedVolume', 'twoPartTariffError',
      'twoPartTariffStatus', 'isApproved']),
    financialYear: new FinancialYear(row.financialYear),
    twoPartTariffReview: userMapper.mapToModel(row.twoPartTariffReview)
  });
};

exports.dbToModel = dbToModel;
