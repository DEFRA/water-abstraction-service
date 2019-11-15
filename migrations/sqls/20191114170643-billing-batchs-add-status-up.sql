create type water.batch_status as enum ('processing', 'complete', 'error');

alter table water.billing_batches
  add column status water.batch_status;

update water.billing_batches
set status = 'complete';

alter table water.billing_batches
  alter column status set not null;
