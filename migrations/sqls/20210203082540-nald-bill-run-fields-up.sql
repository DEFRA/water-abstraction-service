/* Replace with your SQL commands */

create type water.billing_batch_source as enum ('wrls', 'nald');

alter table water.billing_batches 
  add column source water.billing_batch_source not null default 'wrls',
  add column legacy_id varchar default null,
  add column metadata jsonb default null,
  add constraint uniq_legacy_id unique(legacy_id);
