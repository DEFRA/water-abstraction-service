/*
  Update any empty batches to error. This is a crude
  approach but this will allow a user to delete the batch.
*/
update water.billing_batches
set status = 'error'
where status = 'empty';

update water.billing_batch_charge_version_years
set status = 'error'
where status = 'empty';

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
