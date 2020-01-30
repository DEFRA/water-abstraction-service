/* Replace with your SQL commands */
DROP TABLE IF EXISTS water.billing_batch_invoices;

ALTER TABLE water.billing_invoices
  ADD COLUMN billing_batch_id uuid NOT NULL REFERENCES water.billing_batches(billing_batch_id);