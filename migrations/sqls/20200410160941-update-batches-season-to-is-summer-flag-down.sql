alter table water.billing_batches
   add column season water.charge_element_season;

update water.billing_batches
set season = 'all year';

update water.billing_batches
set season = 'summer'
where batch_type = 'two_part_tariff'
and is_summer is true;

alter table water.billing_batches
   alter column season set not null;

alter table water.billing_batches
  drop column is_summer;
