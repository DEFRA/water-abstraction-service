/* remove existing unique constraint */
alter table water.billing_invoices drop constraint unique_batch_year_invoice;

/* drop FY columm */
alter table water.billing_invoices drop column financial_year_ending;

/* restore original unique index */
alter table water.billing_invoices add constraint unique_batch_invoice unique (billing_batch_id, invoice_account_id);
