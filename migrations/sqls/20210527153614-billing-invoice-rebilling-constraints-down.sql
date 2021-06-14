/* Replace with your SQL commands */

drop index unique_batch_year_invoice;
drop index unique_batch_year_rebilling_invoice;
drop index unique_billing_invoice_external_id;

create unique index unique_batch_year_invoice
  on water.billing_invoices(billing_batch_id, financial_year_ending, invoice_account_id) where legacy_id is null;


