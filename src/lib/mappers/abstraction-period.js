'use strict';

const AbstractionPeriod = require('../models/abstraction-period');

const dbToModel = dbRow => {
  const abstractionPeriod = new AbstractionPeriod();
  return abstractionPeriod.fromHash({
    startDay: dbRow.abstractionPeriodStartDay,
    startMonth: dbRow.abstractionPeriodStartMonth,
    endDay: dbRow.abstractionPeriodEndDay,
    endMonth: dbRow.abstractionPeriodEndMonth
  });
};

/**
 * Creates a plain object which can be used in the getBillableDays helper
 * @param {AbstractionPeriod} absPeriod
 */
const modelToHelpers = absPeriod => absPeriod.pick(['startDay', 'startMonth', 'endDay', 'endMonth']);

exports.dbToModel = dbToModel;
exports.modelToHelpers = modelToHelpers;
