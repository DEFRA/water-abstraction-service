'use strict';

const AbstractionPeriod = require('../models/abstraction-period');

const dbToModel = dbRow => {
  const abstractionPeriod = new AbstractionPeriod();
  // we only want to map the abstraction period for ALCS Charge Elements or
  // when it is an SROC charge purpose.
  if (dbRow.scheme === 'alcs' || dbRow.chargePurposeId) {
    abstractionPeriod.fromHash({
      startDay: dbRow.abstractionPeriodStartDay,
      startMonth: dbRow.abstractionPeriodStartMonth,
      endDay: dbRow.abstractionPeriodEndDay,
      endMonth: dbRow.abstractionPeriodEndMonth
    });
  }
  return abstractionPeriod;
};

/**
 * Creates a plain object which can be used in the getBillableDays helper
 * @param {AbstractionPeriod} absPeriod
 */
const modelToHelpers = absPeriod => absPeriod.pick(['startDay', 'startMonth', 'endDay', 'endMonth']);

/**
 * Converts plain JS object representation of abstraction period to
 * AbstractionPeriod model
 * @param {Object} pojo
 * @return {AbstractionPeriod}
 */
const pojoToModel = pojo => {
  const abstractionPeriod = new AbstractionPeriod();
  return abstractionPeriod.fromHash(pojo);
};

exports.dbToModel = dbToModel;
exports.modelToHelpers = modelToHelpers;
exports.pojoToModel = pojoToModel;
