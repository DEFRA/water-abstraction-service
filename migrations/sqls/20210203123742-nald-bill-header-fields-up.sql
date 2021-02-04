alter table water.billing_invoices 
  drop constraint if exists unique_batch_year_invoice,
  add column legacy_id varchar default null,
  add column metadata jsonb default null,
  add constraint uniq_billing_invoice_legacy_id unique(legacy_id),
  add constraint unique_batch_year_invoice unique(billing_batch_id, financial_year_ending, invoice_account_id, legacy_id);
