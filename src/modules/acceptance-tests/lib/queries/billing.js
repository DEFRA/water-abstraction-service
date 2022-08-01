exports.deleteBillingTransactions = `delete from water.billing_transactions t 
  using 
    water.billing_invoice_licences l,
    water.billing_invoices i,
    water.billing_batches b,
    water.regions r
  where
    t.billing_invoice_licence_id=l.billing_invoice_licence_id 
    and l.billing_invoice_id=i.billing_invoice_id
    and i.billing_batch_id=b.billing_batch_id
    and b.region_id=r.region_id 
    and r.is_test=true`

exports.deleteBillingInvoiceLicences = `delete from water.billing_invoice_licences l 
  using 
    water.billing_invoices i,
    water.billing_batches b,
    water.regions r
  where
    l.billing_invoice_id=i.billing_invoice_id
    and i.billing_batch_id=b.billing_batch_id
    and b.region_id=r.region_id 
    and r.is_test=true`

exports.deleteBillingInvoices = `delete from water.billing_invoices i 
  using 
    water.billing_batches b,
    water.regions r
  where
    i.billing_batch_id=b.billing_batch_id
    and b.region_id=r.region_id 
    and r.is_test=true`

exports.deleteBillingBatchChargeVersionYears = `delete from water.billing_batch_charge_version_years y 
  using 
    water.billing_batches b,
    water.regions r
  where
    y.billing_batch_id=b.billing_batch_id
    and b.region_id=r.region_id 
    and r.is_test=true`

exports.deleteBillingBatches = `delete from water.billing_batches b 
  using 
    water.regions r
  where
    b.region_id=r.region_id 
    and r.is_test=true`

exports.deleteBillingVolumes = `delete from water.billing_volumes v
  using 
    water.billing_batches b,
    water.regions r
  where
    v.billing_batch_id=b.billing_batch_id
    and b.region_id=r.region_id 
    and r.is_test=true`
