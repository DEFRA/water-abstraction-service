/* remove existing index */
drop index unique_batch_invoice;

/* create financial year column without not null constraint */
alter table water.billing_invoices add column financial_year_ending smallint;

/* use max financial year of billing batch to update financial year column */
update water.billing_invoices i 
  set financial_year_ending=y.financial_year_ending 
  from (
    select y.billing_batch_id, max(y.financial_year_ending) as financial_year_ending 
      from water.billing_batch_charge_version_years y 
      group by y.billing_batch_id
  ) y
  where i.billing_batch_id=y.billing_batch_id;

/* add not null constraint */
alter table water.billing_invoices alter column financial_year_ending set not null;

/* create new unique constraint including FY */
alter table water.billing_invoices add constraint unique_batch_year_invoice unique (billing_batch_id, financial_year_ending, invoice_account_id);