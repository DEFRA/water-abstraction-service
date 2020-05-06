/* create new columns */
alter table water.charge_versions 
  add column company_id uuid;

alter table water.charge_versions 
  add column invoice_account_id uuid;

/* @TODO will need to make these not-null in future migration */