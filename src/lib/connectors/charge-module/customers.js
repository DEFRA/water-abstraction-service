'use strict'

const got = require('./lib/got-cm')

const updateCustomer = data =>
  got.post('v3/wrls/customer-changes', { json: data })

exports.updateCustomer = updateCustomer
