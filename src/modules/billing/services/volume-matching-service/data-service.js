'use strict';

const validators = require('../../../../lib/models/validators');
const errors = require('../../../../lib/errors');

const { getChargePeriod } = require('../../lib/charge-period');

// Services
const chargeVersionService = require('../../../../lib/services/charge-versions');
const returnGroupService = require('./return-group-service');
const billingVolumesService = require('../billing-volumes-service');

// Models
const FinancialYear = require('../../../../lib/models/financial-year');
const ChargeElementContainer = require('./models/charge-element-container');
const ChargeElementGroup = require('./models/charge-element-group');

const createChargeElementGroup = (chargeVersion, chargePeriod) => {
  const chargeElementContainers = chargeVersion.chargeElements.map(chargeElement => new ChargeElementContainer(chargeElement, chargePeriod));
  return new ChargeElementGroup(chargeElementContainers);
};

/**
 * Creates a ChargeElementGroup for all the elements that are
 * suitable for two-part tariff billing, then splits them
 * in two groups for summer or winter/all-year
 * @param {ChargeVersion} chargeVersion
 * @param {DateRange0} chargePeriod
 * @return {Object}
 */
const createTPTChargeElementGroup = (chargeVersion, chargePeriod, financialYear, billingVolumes) => {
  return createChargeElementGroup(chargeVersion, chargePeriod)
    .createForChargePeriod()
    .createForTwoPartTariff()
    .setFinancialYear(financialYear)
    .setBillingVolumes(billingVolumes);
};

/**
 * Loads the specified charge version and returns as service model.
 * Throws error if not found
 * @param {String} chargeVersionId
 * @return {ChargeVersion}
 */
const getChargeVersion = async chargeVersionId => {
  const chargeVersion = await chargeVersionService.getByChargeVersionId(chargeVersionId);
  if (chargeVersion) {
    return chargeVersion;
  }
  throw new errors.NotFoundError(`Charge version ${chargeVersionId} not found`);
};

/**
 * Collects all the data needed to perform TPT matching for a particular
 * charge version, financial year and season combination
 * @param {String} chargeVersionId
 * @param {FinancialYear} financialYear
 * @return {Promise<Object>}
 */
const getData = async (chargeVersionId, financialYear, batchId) => {
  validators.assertId(chargeVersionId);
  validators.assertIsInstanceOf(financialYear, FinancialYear);

  // Get charge version
  const chargeVersion = await getChargeVersion(chargeVersionId);

  // Get charge period
  const chargePeriod = getChargePeriod(financialYear, chargeVersion);

  // Load billing volumes and returns grouped by season
  const [billingVolumes, returnGroups] = await Promise.all([
    billingVolumesService.getVolumesForChargeElements(chargeVersion.chargeElements, financialYear),
    returnGroupService.getReturnGroups(
      chargeVersion.licence.licenceNumber,
      financialYear
    )
  ]);
  const newBillingVolumes = billingVolumes.map(row => {
    row.billingBatchId = batchId;
    row.isApproved = false;
    return row;
  });
  // Get charge element group
  const chargeElementGroup = createTPTChargeElementGroup(chargeVersion, chargePeriod, financialYear, newBillingVolumes);

  return {
    chargeVersion,
    chargePeriod,
    chargeElementGroup,
    returnGroups
  };
};

exports.getData = getData;
