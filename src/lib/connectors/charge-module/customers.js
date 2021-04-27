'use strict';

const { got } = require('./got');

const updateCustomer = data =>
  got.post('v2/wrls/customer-changes', { json: data });

exports.updateCustomer = updateCustomer;
