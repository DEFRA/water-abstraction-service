-- Working back from the transactions, delete all data related to empty or errored billing batches including the
-- billing_batch records
DELETE FROM water.billing_transactions WHERE billing_transaction_id IN (
  SELECT bt.billing_transaction_id  FROM water.billing_transactions bt
  INNER JOIN water.billing_invoice_licences bil ON bil.billing_invoice_licence_id = bt.billing_invoice_licence_id
  INNER JOIN water.billing_invoices bi ON bi.billing_invoice_id = bil.billing_invoice_id
  INNER JOIN water.billing_batches bb ON bb.billing_batch_id = bi.billing_batch_id
  WHERE bb.status IN ('error', 'empty')
);
DELETE FROM water.billing_invoice_licences WHERE billing_invoice_licence_id IN (
  SELECT bil.billing_invoice_licence_id FROM water.billing_invoice_licences bil
  INNER JOIN water.billing_invoices bi ON bi.billing_invoice_id = bil.billing_invoice_id
  INNER JOIN water.billing_batches bb ON bb.billing_batch_id = bi.billing_batch_id
  WHERE bb.status IN ('error', 'empty')
);
DELETE FROM water.billing_invoices WHERE billing_invoice_id IN (
  SELECT bi.billing_invoice_id FROM water.billing_invoices bi
  INNER JOIN water.billing_batches bb ON bb.billing_batch_id = bi.billing_batch_id
  WHERE bb.status IN ('error', 'empty')
);
DELETE FROM water.billing_batch_charge_version_years WHERE billing_batch_charge_version_year_id IN (
  SELECT bbcvy.billing_batch_charge_version_year_id  FROM water.billing_batch_charge_version_years bbcvy
  INNER JOIN water.billing_batches bb ON bb.billing_batch_id = bbcvy.billing_batch_id
  WHERE bb.status IN ('error', 'empty')
);
DELETE FROM water.billing_volumes WHERE billing_volume_id IN (
  SELECT bv.billing_volume_id  FROM water.billing_volumes bv
  INNER JOIN water.billing_batches bb ON bb.billing_batch_id = bv.billing_batch_id
  WHERE bb.status IN ('error', 'empty')
);
DELETE FROM water.billing_batches WHERE billing_batch_id IN (
  SELECT bb.billing_batch_id  FROM water.billing_batches bb
  WHERE bb.status IN ('error', 'empty')
);
