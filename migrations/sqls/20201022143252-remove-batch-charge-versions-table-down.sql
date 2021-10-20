create table water.billing_batch_charge_versions (
  billing_batch_charge_version_id uuid primary key default gen_random_uuid(),
  billing_batch_id uuid not null
    constraint billing_batch_charge_versions_billing_batch_id_fkey
    references water.billing_batches (billing_batch_id),
  charge_version_id uuid not null
    constraint billing_batch_charge_versions_charge_version_id_fkey
    references water.charge_versions (charge_version_id),
  date_created timestamp not null default now(),
  date_updated timestamp not null default now()
);

alter table water.billing_batch_charge_versions
  add constraint uniq_batch_charge_version unique(billing_batch_id, charge_version_id);

alter table water.billing_batch_charge_version_years drop constraint if exists uniq_batch_charge_version_year_transaction_type_season;

alter table water.billing_batch_charge_version_years
  drop column if exists transaction_type,
  drop column if exists is_summer;

/* Remove duplicate records after dropping transaction_type and is_summer columns */
delete from water.billing_batch_charge_version_years
where billing_batch_charge_version_year_id in
    (select billing_batch_charge_version_year_id
    from
        (select billing_batch_charge_version_year_id,
         ROW_NUMBER() over(partition by billing_batch_id, charge_version_id, financial_year_ending) AS row_num
        from water.billing_batch_charge_version_years ) y
        where y.row_num > 1);

/* Populate water.billing_charge_versions from water.billing_charge_version_years */
insert into water.billing_batch_charge_versions (billing_batch_id, charge_version_id)
select distinct billing_batch_id, charge_version_id
from water.billing_batch_charge_version_years;

alter table water.billing_batch_charge_version_years
  add constraint uniq_batch_charge_version_year unique(billing_batch_id, charge_version_id, financial_year_ending);

drop type if exists water.charge_version_years_transaction_type;
