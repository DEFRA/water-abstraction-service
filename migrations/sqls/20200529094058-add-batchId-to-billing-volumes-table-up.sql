alter table water.billing_volumes
  add column if not exists billing_batch_id uuid not null;

alter table water.billing_volumes drop constraint if exists billing_volumes_billing_batch_id_fkey;

alter table water.billing_volumes
  add constraint billing_volumes_billing_batch_id_fkey
    foreign key(billing_batch_id)
    references water.billing_batches (billing_batch_id);
