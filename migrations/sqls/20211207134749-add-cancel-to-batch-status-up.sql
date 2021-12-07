alter type water.batch_status
  rename to batch_status_old;

create type water.batch_status as enum (
  'processing',
  'review',
  'ready',
  'error',
  'sent',
  'empty',
  'cancel'
);

alter table water.billing_batches
  alter column status type water.batch_status using status::text::water.batch_status;

alter table water.billing_batch_charge_version_years
  alter column status type water.batch_status using status::text::water.batch_status;

drop type water.batch_status_old;
