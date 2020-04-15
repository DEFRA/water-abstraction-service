alter table water.billing_batches
   add column is_summer boolean not null default false;

update water.billing_batches
set is_summer = true
where batch_type = 'two_part_tariff'
and season = 'summer';

alter table water.billing_batches
  drop column season;
