alter table water.billing_transactions
  add column licence_ref varchar not null;

alter table water.billing_invoice_licences
  drop column licence_id;

drop table water.licences;
