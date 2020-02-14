/* Intermediary step to update existing records */
alter type water.batch_status
  rename to batch_status_old;

create type water.batch_status as enum (
  'processing',
  'review',
  'complete',
  'ready',
  'error',
  'sent'
);

alter table water.billing_batches
  alter column status type water.batch_status using status::text::water.batch_status;

alter table water.billing_batch_charge_version_years
  alter column status type water.batch_status using status::text::water.batch_status;

update water.billing_batches
  set status = 'ready' where status = 'complete';

update water.billing_batch_charge_version_years
  set status = 'ready' where status = 'complete';

drop type water.batch_status_old;


/* Implement new enum */
alter type water.batch_status
  rename to batch_status_old;

create type water.batch_status as enum (
  'processing',
  'review',
  'ready',
  'error',
  'sent'
);

alter table water.billing_batches
  alter column status type water.batch_status using status::text::water.batch_status;

alter table water.billing_batch_charge_version_years
  alter column status type water.batch_status using status::text::water.batch_status;

drop type water.batch_status_old;