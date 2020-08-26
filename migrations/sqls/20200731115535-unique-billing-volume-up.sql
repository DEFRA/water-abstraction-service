/* Replace with your SQL commands */
alter table water.billing_volumes
  drop constraint uniq_charge_element_id_financial_year;

alter table water.billing_volumes
  add constraint uniq_charge_element_id_financial_year_season unique (charge_element_id, financial_year, is_summer);