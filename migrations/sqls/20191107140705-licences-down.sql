alter table water.billing_transactions
  add column licence_ref varchar not null;

drop table water.licences;
