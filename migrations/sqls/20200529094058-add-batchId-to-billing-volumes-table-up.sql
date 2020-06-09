/* Replace with your SQL commands */
alter table water.billing_volumes
  add column billing_batch_id uuid not null
    constraint billing_volumes_billing_batch_id_fkey
    references water.billing_batches (billing_batch_id);