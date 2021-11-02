/* Remove the existing index */
drop index if exists uniq_charge_element_id_financial_year_season_err;

/* Remove duplicated rows */
DELETE FROM water.billing_volumes
WHERE ctid NOT IN (
   SELECT min(ctid)
   FROM   water.billing_volumes
   GROUP  BY charge_element_id, financial_year, is_summer, errored_on);

  /* Create a partial index instead */
create unique index uniq_charge_element_id_financial_year_season_err 
on water.billing_volumes(charge_element_id, financial_year, is_summer) where errored_on is null;
