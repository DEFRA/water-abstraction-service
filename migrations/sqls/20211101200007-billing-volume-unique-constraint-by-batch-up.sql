/* Remove the existing index */
drop index if exists uniq_charge_element_id_financial_year_season_err;


  /* Create a partial index instead */
create unique index uniq_charge_element_id_financial_year_season_err 
on water.billing_volumes(charge_element_id, financial_year, is_summer, billing_batch_id) where errored_on is null;
