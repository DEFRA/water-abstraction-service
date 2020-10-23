drop table if exists water.billing_batch_charge_versions;

create type water.charge_version_years_transaction_type as enum ('annual', 'two_part_tariff');

alter table water.billing_batch_charge_version_years
  add column transaction_type water.charge_version_years_transaction_type not null,
  add column is_summer boolean not null;
