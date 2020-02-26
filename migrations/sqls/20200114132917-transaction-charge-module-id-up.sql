alter table water.billing_transactions 
  add column external_id uuid;

alter table water.billing_transactions 
  add column volume numeric;

alter table water.billing_transactions 
  alter column authorised_days type smallint;

alter table water.billing_transactions 
  alter column billable_days type smallint;