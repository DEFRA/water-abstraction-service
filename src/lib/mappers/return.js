'use strict';

const { get } = require('lodash');

const AbstractionPeriod = require('../models/abstraction-period');
const Return = require('../models/return');
const DateRange = require('../models/date-range');

const returnsServiceToModel = (ret, allPurposeUses) => {
  const { nald } = ret.metadata;

  // Find matching purpose uses
  const codes = get(ret, 'metadata.purposes', []).map(purpose => purpose.tertiary.code);
  const purposeUses = allPurposeUses.filter(purposeUse => codes.includes(purposeUse.code));

  // Create abs period
  const abstractionPeriod = new AbstractionPeriod();
  abstractionPeriod.fromHash({
    startDay: nald.periodStartDay,
    startMonth: nald.periodStartMonth,
    endDay: nald.periodEndDay,
    endMonth: nald.periodEndMonth
  });

  const r = new Return(ret.return_id);
  return r.fromHash({
    dateRange: new DateRange(ret.start_date, ret.end_date),
    isUnderQuery: ret.under_query,
    isSummer: get(ret, 'metadata.isSummer', false),
    dueDate: ret.due_date,
    receivedDate: ret.received_date,
    status: ret.status,
    purposeUses,
    abstractionPeriod
  });
};

exports.returnsServiceToModel = returnsServiceToModel;
