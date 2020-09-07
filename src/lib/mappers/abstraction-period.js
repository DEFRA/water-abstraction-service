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

/**
 * Converts a model to database camel-cased fields
 * @param {AbstractionPeriod} model
 * @return {Object}
 */
const modelToDb = model => ({
  abstractionPeriodStartDay: model.startDay,
  abstractionPeriodStartMonth: model.startMonth,
  abstractionPeriodEndDay: model.endDay,
  abstractionPeriodEndMonth: model.endMonth
});

exports.dbToModel = dbToModel;
exports.modelToHelpers = modelToHelpers;
exports.pojoToModel = pojoToModel;
exports.modelToDb = modelToDb;
