'use strict';

const { ChargeVersion } = require('../bookshelf');
const raw = require('./lib/raw');
const queries = require('./queries/charge-versions');

const findOne = async (id) => {
  const model = await ChargeVersion
    .forge({ chargeVersionId: id })
    .fetch({
      withRelated: [
        'chargeElements',
        'chargeElements.purposePrimary',
        'chargeElements.purposeSecondary',
        'chargeElements.purposeUse',
        'licence',
        'licence.region',
        'licence.licenceAgreements'
      ]
    });

  return model.toJSON();
};

/**
 * Gets the charge versions that are valid for charging
 * in the specified region/financial year
 *
 * @param {String} regionId
 * @param {Number} financialYearEnding
 */
const findValidInRegionAndFinancialYear = (regionId, financialYearEnding) => {
  const params = {
    regionId,
    startDate: `${financialYearEnding - 1}-04-01`,
    endDate: `${financialYearEnding}-03-31`
  };
  return raw.multiRow(queries.findValidInRegionAndFinancialYear, params);
};

exports.findOne = findOne;
exports.findValidInRegionAndFinancialYear = findValidInRegionAndFinancialYear;
