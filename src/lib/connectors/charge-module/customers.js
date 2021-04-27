'use strict';

const got = require('./lib/got-cm');

const updateCustomer = data =>
  got.post('v2/wrls/customer-changes', { json: data });

exports.updateCustomer = updateCustomer;
