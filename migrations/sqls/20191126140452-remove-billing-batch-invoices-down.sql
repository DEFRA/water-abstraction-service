/* Replace with your SQL commands */

-- Table Definition ----------------------------------------------

CREATE TABLE IF NOT EXISTS water.billing_batch_invoices (
    billing_batch_invoice_id uuid DEFAULT public.gen_random_uuid() PRIMARY KEY,
    billing_batch_id uuid NOT NULL REFERENCES water.billing_batches(billing_batch_id),
    billing_invoice_id uuid NOT NULL REFERENCES water.billing_invoices(billing_invoice_id),
    date_created timestamp without time zone NOT NULL DEFAULT now(),
    date_updated timestamp without time zone NOT NULL DEFAULT now()
);

-- Indices -------------------------------------------------------

ALTER TABLE water.billing_invoices
  DROP COLUMN billing_batch_id;
