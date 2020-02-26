/* Replace with your SQL commands */
alter table water.billing_batches
  add column invoice_count int;

alter table water.billing_batches
  add column credit_note_count int;

alter table water.billing_batches
  add column net_total bigint;

alter table water.billing_batches
  add column external_id int;