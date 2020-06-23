/* remove existing unique constraint */
alter table water.billing_invoices drop constraint unique_batch_year_invoice;

/* drop FY columm */
alter table water.billing_invoices drop column financial_year_ending;

/* restore original unique index */
create unique index unique_batch_invoice on water.billing_invoices(billing_batch_id, invoice_account_id);