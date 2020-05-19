const twoPartTariffMatching = require('./two-part-tariff-matching');
const returnHelpers = require('./returns-helpers');

/**
 * Process returns matching for given invoice licence
 *
 * @param {ChargeVersion} chargeVersion
 * @param {Integer} financialYear
 * @param {Boolean} isSummer
 * @return {Object} matching results containing chargeElementId and actualReturnQuantity
 */
const calculateVolumes = async (chargeVersion, financialYear, isSummer) => {
  const returnsForLicence = await returnHelpers.getReturnsForMatching(chargeVersion.licence.licenceNumber, financialYear, isSummer);
  return twoPartTariffMatching.matchReturnsToChargeElements(chargeVersion.chargeElements, returnsForLicence);
};

exports.calculateVolumes = calculateVolumes;
