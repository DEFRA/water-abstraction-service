drop index unique_batch_year_invoice;

alter table water.billing_invoices 
  add constraint unique_batch_year_invoice unique(billing_batch_id, financial_year_ending, invoice_account_id, legacy_id);
