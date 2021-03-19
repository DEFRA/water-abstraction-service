'use strict';
const request = require('./request');

const updateCustomer = data => request.post('v2/wrls/customer-changes', data);

exports.updateCustomer = updateCustomer;
