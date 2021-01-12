/* Drop the errored_on column */
alter table water.billing_volumes
  drop column errored_on;

/* Remove the existing index */
DROP index if exists uniq_charge_element_id_financial_year_season_err;

/* Remove duplicated rows */
DELETE FROM water.billing_volumes
WHERE ctid NOT IN (
   SELECT min(ctid)
   FROM   water.billing_volumes
   GROUP  BY charge_element_id, financial_year, is_summer);

/* Recreate the old constraint */
alter table water.billing_volumes
  add constraint uniq_charge_element_id_financial_year_season unique (charge_element_id, financial_year, is_summer);
