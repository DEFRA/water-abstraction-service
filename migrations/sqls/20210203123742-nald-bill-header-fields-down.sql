/* Replace with your SQL commands */
alter table water.billing_invoices
  drop constraint unique_batch_year_invoice,
  drop constraint uniq_billing_invoice_legacy_id,
  drop column legacy_id,
  drop column metadata,
  add constraint unique_batch_year_invoice unique(billing_batch_id, financial_year_ending, invoice_account_id);

