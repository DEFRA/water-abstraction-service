'use strict';

const { sortBy } = require('lodash');
const { charging } = require('@envage/water-abstraction-helpers');

const validators = require('../../../../lib/models/validators');
const absPeriodMapper = require('../../../../lib/mappers/abstraction-period');
const billingVolumesMapper = require('../../mappers/billing-volume');
const { getChargePeriod } = require('../../lib/charge-period');

// Service models
const DateRange = require('../../../../lib/models/date-range');
const FinancialYear = require('../../../../lib/models/financial-year');
const BillingVolume = require('../../../../lib/models/billing-volume');
const constants = require('../../../../lib/models/constants');

// Services
const chargeVersionService = require('../charge-version-service');

// Repos
const billingVolumesRepo = require('../../../../lib/connectors/repos/billing-volumes');

/**
 * Loads any existing BillingVolumes using data from water.billing_volumes
 * for the supplied set of matching elements and places them within the
 * matchingElement.billingVolumes object with the correct season key
 * This overwrites anything there originally
 * @param {Array} matchingElements
 * @param {FinancialYear} financialYear
 */
const decorateMatchingElementsWithBillingVolumes = async (matchingElements, financialYear) => {
  const chargeElementIds = matchingElements.map(matchingElement => matchingElement.chargeElement.id);
  const rows = await billingVolumesRepo.findByChargeElementIdsAndFinancialYear(chargeElementIds, financialYear.endYear);
  const billingVolumes = rows.map(billingVolumesMapper.dbToModel);
  billingVolumes.forEach(billingVolume => {
    const matchingElement = matchingElements.find(matchingElement => matchingElement.chargeElement.id === billingVolumes.chargeElementId);
    matchingElement.billingVolume = billingVolume;
  });
  return matchingElements;
};
/**
 * Gets the date range for a charge element.  Normally this will be the charge
 * period for the overall charge version/licence.  However for time-limited
 * elements, we calculate the intersecting date range between the charge period
 * and the time-limited dates.
 * If there is no intersection, null is returned.
 *
 * @param {ChargeElement} chargeElement
 * @param {DateRange} chargePeriod
 * @return {DateRange|null}
 */
const getElementChargePeriod = (chargeElement, chargePeriod) => {
  if (!chargeElement.timeLimitedPeriod) {
    return chargePeriod;
  }
  const rangeA = chargePeriod.toMomentRange();
  const rangeB = chargePeriod.toMomentRange();

  // There is no overlap
  if (!rangeA.overlaps(rangeB)) {
    return null;
  }
  const intersectingRange = rangeA.intersect(rangeB);
  return DateRange.fromMomentRange(intersectingRange);
};

/**
 * Gets the number of days of abstraction based on the abstraction period
 * and supplied date range
 * @param {AbstractionPeriod} absPeriod
 * @param {DateRange} dateRange
 * @return {Number}
 */
const getDaysInAbstractionPeriod = (absPeriod, dateRange) => {
  if (!dateRange) {
    return null;
  }
  const { startDate, endDate } = dateRange;
  const obj = absPeriodMapper.modelToHelpers(absPeriod);
  return charging.getBillableDays(obj, startDate, endDate);
};

/**
 * Creates a BillingVolume ready to accept returns volumes based
 * on the supplied charge element
 * @param {ChargeElement} chargeElement
 */
const createBillingVolume = chargeElement => {
  console.log(chargeElement.abstractionPeriod);
  const isSummer = chargeElement.abstractionPeriod.getChargeSeason() === constants.CHARGE_SEASON.summer;
  const billingVolume = new BillingVolume();
  return billingVolume.fromHash({
    chargeElementId: chargeElement.id,
    isSummer
  });
};

/**
 * Initialises a matching element from a charge element
 * This includes additional information and billing volumes
 * @param {ChargeElement} chargeElement
 * @return {Object}
 */
const mapChargeElement = (chargeElement, financialYear, chargePeriod) => {
  const elementChargePeriod = getElementChargePeriod(chargeElement, chargePeriod);
  const authorisedDays = getDaysInAbstractionPeriod(chargeElement.abstractionPeriod, financialYear);
  const obj = {
    chargeElement,
    // A charge element is considered "summer" for returns matching based on its abs period,
    // not the season factor
    // isSummer: chargeElement.abstractionPeriod.getChargeSeason() === constants.CHARGE_SEASON.summer,
    billingVolume: createBillingVolume(chargeElement),
    elementChargePeriod,
    billableDays: 0,
    proRataRatio: null,
    maxAllocatableVolume: null,
    authorisedDays
  };

  // If the element charge period is valid add additional details
  if (elementChargePeriod) {
    const billableDays = getDaysInAbstractionPeriod(chargeElement.abstractionPeriod, elementChargePeriod);
    const proRataRatio = billableDays / authorisedDays;
    Object.assign(obj, {
      billableDays,
      proRataRatio,
      maxAllocatableVolume: chargeElement.volume * proRataRatio
    });
  }

  return obj;
};

/**
 * Checks if charge element has a TPT purpose
 * @param {ChargeVersion} chargeVersion
 * @return {Boolean}
 */
const isTwoPartTariffPurpose = chargeElement => chargeElement.purposeUse.isTwoPartTariff;

/**
 * Check if any matching elements have a summer abs period
 * @param {Array} matchingElements
 * @return {Boolean} checks whether any of the charge elements have
 */
const isIncludesSummerElements = matchingElements => matchingElements.some(matchingElement => matchingElement.isSummer);

/**
 * Initialises the data structure needed for returns matching
 * Each charge element has a summer and winter/all-year BillingVolume
 * element for allocation, and additional details that assist with
 * the matching process
 * @param {String} chargeVersionId
 * @param {FinancialYear} financialYear
 * @return {Object}
 */
const getInitialDataStructure = async (chargeVersionId, financialYear) => {
  validators.assertId(chargeVersionId);
  validators.assertIsInstanceOf(financialYear, FinancialYear);

  // Load charge version
  const chargeVersion = await chargeVersionService.getByChargeVersionId(chargeVersionId);
  const chargePeriod = getChargePeriod(financialYear, chargeVersion);

  // Initialise matching elements
  const matchingElements = chargeVersion.chargeElements
    .filter(isTwoPartTariffPurpose)
    .map(chargeElement => mapChargeElement(chargeElement, financialYear, chargePeriod));

  // Add existing billing volumes to the data structure from DB
  await decorateMatchingElementsWithBillingVolumes(matchingElements, financialYear);

  return {
    financialYear,
    licence: chargeVersion.licence,
    matchingElements,
    chargePeriod,
    isIncludesSummerElements: isIncludesSummerElements(matchingElements)
  };
};

exports.getInitialDataStructure = getInitialDataStructure;
