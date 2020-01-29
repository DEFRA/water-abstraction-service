'use strict';

const AbstractionPeriod = require('../../../lib/models/abstraction-period');

/**
 * Creates an AbstractionPeriod instance from camel-cased charge element data
 * @param {Object} chargeElementRow - charge element row from the charge processor
 * @return {AbstractionPeriod}
 */
const chargeToModel = chargeElementRow => {
  const element = new AbstractionPeriod();
  element.fromHash({
    startDay: chargeElementRow.abstractionPeriodStartDay,
    startMonth: chargeElementRow.abstractionPeriodStartMonth,
    endDay: chargeElementRow.abstractionPeriodEndDay,
    endMonth: chargeElementRow.abstractionPeriodEndMonth
  });
  return element;
};

exports.chargeToModel = chargeToModel;
