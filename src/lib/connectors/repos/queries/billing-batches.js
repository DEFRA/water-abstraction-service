'use strict'

const deleteAllBillingData = `
truncate 
water.billing_batch_charge_version_years, 
water.billing_batches, 
water.billing_invoice_licences,
water.billing_invoices, 
water.billing_transactions, 
water.billing_volumes,
water.charge_versions,
water.charge_purposes,
water.charge_elements
`

exports.deleteAllBillingData = deleteAllBillingData
