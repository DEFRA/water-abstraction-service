'use strict';
const request = require('./request');

const updateCustomer = data => request.post('v1/wrls/customer_changes', data);

exports.updateCustomer = updateCustomer;
