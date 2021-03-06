alter table water.billing_invoices 
  drop constraint if exists unique_batch_year_invoice;

create unique index unique_batch_year_invoice 
  on water.billing_invoices(billing_batch_id, financial_year_ending, invoice_account_id) 
  where legacy_id is null;
