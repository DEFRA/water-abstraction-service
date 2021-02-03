/* Replace with your SQL commands */
alter table water.billing_invoices
  drop constraint uniq_billing_invoice_legacy_id,
  drop column legacy_id,
  drop column metadata;

