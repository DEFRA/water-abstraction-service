/* Replace with your SQL commands */
alter table water.billing_transactions
  drop column source_value,
  drop column season_value,
  drop column loss_value,
  add column legacy_id varchar default null,
  add column metadata jsonb default null,
  add constraint uniq_billing_trans_legacy_id unique(legacy_id);
