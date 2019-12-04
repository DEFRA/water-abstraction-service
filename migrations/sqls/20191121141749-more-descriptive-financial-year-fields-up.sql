alter table water.billing_batches
  rename start_financial_year to from_financial_year_ending;

alter table water.billing_batches
  rename end_financial_year to to_financial_year_ending;

alter table water.billing_batch_charge_version_years
  rename financial_year to financial_year_ending;
