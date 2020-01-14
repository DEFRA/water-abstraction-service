/* Replace with your SQL commands */
alter table water.billing_transactions 
  drop column external_id;

alter table water.billing_transactions 
  drop column volume;

alter table water.billing_transactions 
  alter column authorised_days type numeric;

alter table water.billing_transactions 
  alter column billable_days type numeric;