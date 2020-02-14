'use strict';

const { BillingBatchChargeVersionYear } = require('../bookshelf');

const update = (id, data) =>
  BillingBatchChargeVersionYear
    .forge({ billingBatchChargeVersionYearId: id })
    .save(data);

exports.update = update;
