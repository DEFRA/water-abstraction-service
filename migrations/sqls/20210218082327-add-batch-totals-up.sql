alter table water.billing_batches
  add column invoice_value numeric,
  add column credit_note_value numeric;
