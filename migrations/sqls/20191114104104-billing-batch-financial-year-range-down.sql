alter table water.billing_batches
  add column financial_year integer;

update water.billing_batches
set financial_year = end_financial_year;

alter table water.billing_batches
  drop column start_financial_year,
  drop column end_financial_year,
  alter column financial_year set not null;
