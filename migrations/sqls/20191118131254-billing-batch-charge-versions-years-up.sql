create table water.billing_batch_charge_version_years (
  billing_batch_charge_version_year_id uuid
    primary key
    default gen_random_uuid(),
  billing_batch_id uuid
    not null
    constraint billing_batch_charge_version_years_billing_batch_id_fkey
    references water.billing_batches (billing_batch_id),
  charge_version_id uuid
    not null
    constraint billing_batch_charge_version_years_charge_version_id_fkey
    references water.charge_versions (charge_version_id),
  financial_year integer not null,
  status water.batch_status not null,
  date_created timestamp not null default now(),
  date_updated timestamp not null default now()
)
