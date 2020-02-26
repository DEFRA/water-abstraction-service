/* Replace with your SQL commands */
alter table water.billing_batches
  drop column invoice_count;

alter table water.billing_batches
  drop column credit_note_count;

alter table water.billing_batches
  drop column net_total;

alter table water.billing_batches
  drop column external_id;