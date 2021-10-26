'use strict';

const got = require('./lib/got-cm');

const updateCustomer = data =>
  got.post('v2/wrls/customer-changes', { json: data });

const getCustomerFiles = (days = 1) => got.get('v2/wrls/customer-files/' + days);

exports.updateCustomer = updateCustomer;
exports.getCustomerFiles = getCustomerFiles;
