/* Replace with your SQL commands */
alter table water.billing_batches
  drop constraint uniq_legacy_id,
  drop column source,
  drop column legacy_id,
  drop column metadata;

drop type water.billing_batch_source;
