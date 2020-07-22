'use strict';

const validators = require('../../../../lib/models/validators');
const { logger } = require('../../../../logger');

// Models
const DateRange = require('../../../../lib/models/date-range');
const ChargeElementGroup = require('./models/charge-element-group');
const ReturnGroup = require('./models/return-group');

/**
 * Allocates the return line volume
 * - If there are several groups of matching charge elements
 *   with a single purpose use, then the return line volume
 *   is pro-rated according to the billable ratio of the purposes
 * @param {Array<ChargeElementGroup>} lineChargeElementGroups
 * @param {ReturnLine} returnLine
 */
const allocateReturnLine = (lineChargeElementGroups, returnLine) => {
  const totalVolume = lineChargeElementGroups.reduce((acc, chargeElementGroup) =>
    acc + chargeElementGroup.volume
  , 0);
  // Allocate volumes
  lineChargeElementGroups.forEach(chargeElementGroup => {
    // Get ratio of purposes for allocation
    const purposeRatio = chargeElementGroup.volume / totalVolume;
    // Convert to ML
    const qty = purposeRatio * (returnLine.volume / 1000);
    return chargeElementGroup.allocate(qty);
  });
};

const match = (chargePeriod, chargeElementGroup, returnGroup) => {
  validators.assertIsInstanceOf(chargePeriod, DateRange);
  validators.assertIsInstanceOf(chargeElementGroup, ChargeElementGroup);
  validators.assertIsInstanceOf(returnGroup, ReturnGroup);

  // Returns have errors - assign error and full billable/null to billing volumes
  if (returnGroup.errorCode) {
    chargeElementGroup.setTwoPartTariffStatus(returnGroup.errorCode);
    return chargeElementGroup.toBillingVolumes();
  }

  returnGroup.returns.forEach(ret => {
    logger.info(`Matching return ${ret.id}`);

    // Create list of charge elements for return
    const returnChargeElementGroup = chargeElementGroup.createForReturn(ret);

    // Create list of pro-rated return lines
    const returnLines = ret.currentReturnVersion.getReturnLinesForBilling(chargePeriod, ret.abstractionPeriod);

    returnLines.forEach(returnLine => {
      // Create matching groups
      const lineChargeElementGroups = returnChargeElementGroup.createForReturnLine(returnLine);

      allocateReturnLine(lineChargeElementGroups, returnLine);
    });
  });

  // Perform re-allocation
  chargeElementGroup.reallocate();
  chargeElementGroup.flagOverAbstraction();

  return chargeElementGroup.toBillingVolumes();
};

exports.match = match;
