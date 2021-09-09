/* Replace with your SQL commands */

drop index unique_batch_year_invoice;

create unique index unique_batch_year_invoice
  on water.billing_invoices(billing_batch_id, financial_year_ending, invoice_account_id) where legacy_id is null and rebilling_state is null;

create unique index unique_batch_year_rebilling_invoice
  on water.billing_invoices(billing_batch_id, financial_year_ending, invoice_account_id, rebilling_state) where legacy_id is null and rebilling_state is not null;

create unique index unique_billing_invoice_external_id
  on water.billing_invoices(external_id);
