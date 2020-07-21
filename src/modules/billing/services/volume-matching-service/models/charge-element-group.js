'use strict';

const { groupBy, sortBy } = require('lodash');

const validators = require('../../../../../lib/models/validators');
const Return = require('../../../../../lib/models/return');

const PurposeUse = require('../../../../../lib/models/purpose-use');
const ChargeElement = require('../../../../../lib/models/charge-element');
const ChargeElementContainer = require('./charge-element-container');
const { RETURN_SEASONS } = require('../../../../../lib/models/constants');

/**
 * Checks whether the charge element purpose matches one of the purposes
 * on the return
 * @param {Return} ret
 * @param {ChargeElementContainer} chargeElementContainer
 * @return {Boolean}
 */
const isPurposeUseMatch = (ret, chargeElementContainer) => {
  const purposeUseIds = ret.purposeUses.map(purposeUse => purposeUse.id);
  return purposeUseIds.includes(chargeElementContainer.chargeElement.purposeUse.id);
};

/**
 * Checks whether the ChargeElementContainer supplied is for a summer element
 * @param {ChargeElementContainer} chargeElementContainer
 * @return {Boolean}
 */
const isSummerChargeElementContainer = chargeElementContainer => chargeElementContainer.billingVolume.isSummer;

/**
 * Gets a score for sorting charge elements
 * @param {ChargeElementContainer} chargeElementContainer
 * @return {Number}
 */
const getElementSortScore = chargeElementContainer => {
  // Initial score is based on abstraction days.  We try to fill up
  // elements with fewer days first
  let score = chargeElementContainer.abstractionDays;

  // If charge element is a supported source, we give these preference
  const isSupported = chargeElementContainer.chargeElement.source === ChargeElement.sources.supported;
  if (isSupported) {
    score -= 1000;
  }
  return score;
};

class ChargeElementGroup {
  /**
   * @constructor
   * @param {Array<ChargeElementContainer>} [chargeElementContainers]
   */
  constructor (chargeElementContainers) {
    this.chargeElementContainers = chargeElementContainers || [];
  }

  /**
   * Sets the charge element containers
   * @param {Array<ChargeElementContainer>} chargeElementContainers
   */
  set chargeElementContainers (chargeElementContainers) {
    validators.assertIsArrayOfType(chargeElementContainers, ChargeElementContainer);
    this._chargeElementContainers = chargeElementContainers;
  }

  /**
   * Gets the sum of billable/authorised for all charge
   * elements in the group.  This is needed when pro-rating volumes by purpose
   * @return {Number}
   */
  get volume () {
    return this._chargeElementContainers.reduce((acc, chargeElementContainer) =>
      chargeElementContainer.chargeElement.volume
    , 0);
  }

  /**
   * Checks whether the charge element group contains summer elements
   * @return {Boolean}
   */
  isSummerElements () {
    return this._chargeElementContainers.some(isSummerChargeElementContainer);
  }

  /**
   * Checks whether there are any charge element containers in this group
   * @return {Boolean}
   */
  isEmpty () {
    return this._chargeElementContainers.length === 0;
  }

  /**
   * Checks whether this charge element group contains at least one element
   * matching the supplied purpose use
   * @param {PurposeUse} purposeUse
   * @return {Boolean}
   */
  isPurposeUseMatch (purposeUse) {
    validators.assertIsArrayOfType(purposeUse, PurposeUse);
    return this._chargeElementContainers.some(chargeElementContainer =>
      chargeElementContainer.chargeElement.purposeUse.id === purposeUse.id
    );
  }

  /**
   * Creates a new ChargeElementGroup with only two-part tariff purposes included
   * @return {ChargeElementGroup}
   */
  createForTwoPartTariff () {
    const chargeElementContainers = this._chargeElementContainers
      .filter(chargeElementContainer => chargeElementContainer.isTwoPartTariffPurpose);
    return new ChargeElementGroup(chargeElementContainers);
  }

  /**
   * Creates a new ChargeElementGroup for the supplied season
   * @param {String} season
   * @return {ChargeElementGroup}
   */
  createForSeason (season) {
    validators.assertEnum(season, Object.values(RETURN_SEASONS));
    // Filter elements that match the supplied season
    const isSummer = season === RETURN_SEASONS.summer;
    const elements = this._chargeElementContainers.filter(chargeElementContainer =>
      chargeElementContainer.isSummer === isSummer
    );
    return new ChargeElementGroup(elements);
  }

  /**
   * Creates a new ChargeElementGroup containing only elements that are
   * candidates for matching the supplied return
   * @param {Return} ret
   * @return {ChargeElementGroup}
   */
  createForReturn (ret) {
    validators.assertIsArrayOfType(ret, Return);

    // Get only elements with purpose uses matching the return purpose
    const elements = this._chargeElementContainers
      .filter(chargeElementContainer => isPurposeUseMatch(ret, chargeElementContainer));

    return new ChargeElementGroup(elements);
  }

  /**
   * Creates new ChargeElementGroups for each purpose that match the supplied
   * return line
   * @param {ReturnLine} returnLine
   * @return {Array<ChargeElementGroup>}
   */
  createForReturnLine (returnLine) {
    // Only consider elements with abs period / time limits that match return line
    const elements = this._chargeElementContainers.filter(
      chargeElementContainer => chargeElementContainer.isReturnLineMatch(returnLine)
    );

    // Sort elements
    const sortedElements = sortBy(elements, getElementSortScore);

    // Group by purpose use
    const groups = groupBy(sortedElements,
      element => element.chargeElement.purposeUse.id
    );

    // Return as array of element groups
    return Object.values(groups).map(
      chargeElementContainers => new ChargeElementGroup(chargeElementContainers)
    );
  }
};

module.exports = ChargeElementGroup;
