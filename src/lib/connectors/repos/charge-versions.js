'use strict';

const { ChargeVersion } = require('../bookshelf');
const raw = require('./lib/raw');
const queries = require('./queries/charge-versions');
const helpers = require('./lib/helpers');

const sharedRelations = [
  'chargeElements',
  'chargeElements.purposePrimary',
  'chargeElements.purposeSecondary',
  'chargeElements.purposeUse',
  'licence',
  'licence.region',
  'licence.licenceAgreements',
  'licence.licenceAgreements.financialAgreementType',
  'changeReason'
];

const findOne = async chargeVersionId => {
  const model = await ChargeVersion
    .forge({ chargeVersionId })
    .fetch({
      withRelated: sharedRelations
    });

  return model.toJSON();
};

const findMany = async chargeVersionIds => {
  const models = await ChargeVersion
    .forge()
    .where('charge_version_id', 'in', chargeVersionIds)
    .fetchAll({
      withRelated: ['changeReason']
    });
  return models.toJSON();
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

const findByLicenceId = async licenceId => {
  const models = await ChargeVersion
    .forge()
    .where('licence_id', licenceId)
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
const findValidInRegionAndFinancialYear = (regionId, financialYearEnding, includeInSupplementaryStatus) => {
  const params = {
    regionId,
    financialYearEnding,
    includeInSupplementaryStatus
  };
  return raw.multiRow(queries.findValidInRegionAndFinancialYear, params);
};

/**
 * Gets the charge versions that are valid for charging
 * in the specified region/financial year
 *
 * @param {String} regionId
 * @param {Number} financialYearEnding
 */
const findValidInRegionAndFinancialYearSupplementary = (regionId, financialYearEnding) => {
  const params = {
    regionId,
    financialYearEnding
  };
  return raw.multiRow(queries.findValidInRegionAndFinancialYearSupplementary, params);
};

/**
 * Updates the specified charge version with the supplied changes
 *
 * @param {String} id
 * @param {Object} changes
 */
const update = (id, changes) =>
  helpers.update(ChargeVersion, 'chargeVersionId', id, changes);

exports.create = create;
exports.findOne = findOne;
exports.findMany = findMany;
exports.findByLicenceRef = findByLicenceRef;
exports.findValidInRegionAndFinancialYear = findValidInRegionAndFinancialYear;
exports.update = update;
exports.findByLicenceId = findByLicenceId;
exports.findValidInRegionAndFinancialYearSupplementary = findValidInRegionAndFinancialYearSupplementary;
