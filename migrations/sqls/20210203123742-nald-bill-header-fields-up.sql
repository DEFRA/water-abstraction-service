alter table water.billing_invoices 
  add column legacy_id varchar default null,
  add column metadata jsonb default null,
  add constraint uniq_billing_invoice_legacy_id unique(legacy_id);
