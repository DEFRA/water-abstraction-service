'use strict';

const { ChargeVersion } = require('../bookshelf');
const raw = require('./lib/raw');
const queries = require('./queries/charge-versions');

const sharedRelations = [
  'chargeElements',
  'chargeElements.purposePrimary',
  'chargeElements.purposeSecondary',
  'chargeElements.purposeUse',
  'licence',
  'licence.region',
  'licence.licenceAgreements'
];

const findOne = async chargeVersionId => {
  const model = await ChargeVersion
    .forge({ chargeVersionId })
    .fetch({
      withRelated: sharedRelations
    });

  return model.toJSON();
};

const findByLicenceRef = async licenceRef => {
  const models = await ChargeVersion
    .forge()
    .where('licence_ref', licenceRef)
    .orderBy('start_date')
    .fetchAll({
      withRelated: sharedRelations
    });

  return models.toJSON();
};

const create = async data => {
  const model = await ChargeVersion.forge(data).save();
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

exports.create = create;
exports.findOne = findOne;
exports.findByLicenceRef = findByLicenceRef;
exports.findValidInRegionAndFinancialYear = findValidInRegionAndFinancialYear;
