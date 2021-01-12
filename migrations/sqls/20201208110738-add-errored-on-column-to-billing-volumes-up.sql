/* Add the column */
alter table water.billing_volumes
  add column if not exists errored_on timestamp DEFAULT null;

/* Drop the existing constraint */
alter table water.billing_volumes
  drop constraint uniq_charge_element_id_financial_year_season;

/* Mark the volumes that currently belong to a failed batch */
UPDATE water.billing_volumes set errored_on = now() WHERE billing_batch_id IN (SELECT bb.billing_batch_id FROM water.billing_batches bb WHERE status='error');

/* Create a partial index instead */
create unique index uniq_charge_element_id_financial_year_season_err on water.billing_volumes(charge_element_id, financial_year, is_summer) where errored_on is null;