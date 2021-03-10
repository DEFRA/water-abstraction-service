/* Replace with your SQL commands */
alter table water.billing_transactions
  drop constraint uniq_billing_trans_legacy_id,
  drop column legacy_id,
  drop column metadata,
  add column source_value numeric,
  add column season_value numeric,
  add column loss_value numeric;
