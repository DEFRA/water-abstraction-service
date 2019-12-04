alter table water.billing_batches
  rename from_financial_year_ending to start_financial_year;

alter table water.billing_batches
  rename to_financial_year_ending to end_financial_year;

alter table water.billing_batch_charge_version_years
  rename financial_year_ending to financial_year;
