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

exports.dbToModel = dbToModel;
