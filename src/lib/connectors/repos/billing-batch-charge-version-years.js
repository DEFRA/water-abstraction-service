'use strict';

const { BillingBatchChargeVersionYear } = require('../bookshelf');

const setStatus = (id, status) =>
  BillingBatchChargeVersionYear
    .forge({ billingBatchChargeVersionYearId: id })
    .save({ status });

exports.setStatus = setStatus;
