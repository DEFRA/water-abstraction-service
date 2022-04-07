'use strict';

const got = require('./lib/got-cm');

const updateCustomer = data =>
  got.post('v3/wrls/customer-changes', { json: data });

const getCustomerFiles = (days = 1) => got.get('v3/wrls/customer-files/' + days);

exports.updateCustomer = updateCustomer;
exports.getCustomerFiles = getCustomerFiles;
