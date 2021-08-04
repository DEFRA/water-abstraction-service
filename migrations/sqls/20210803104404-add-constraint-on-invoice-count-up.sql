UPDATE water.billing_batches SET invoice_value = 0 WHERE invoice_value = -1;
UPDATE water.billing_batches SET invoice_count = 0 WHERE invoice_count = -1;

ALTER TABLE water.billing_batches
    ADD CONSTRAINT MIN_ZERO_INVOICE_COUNT CHECK (invoice_count >= 0);

ALTER TABLE water.billing_batches
    ADD CONSTRAINT MIN_ZERO_INVOICE_VALUE CHECK (invoice_value >= 0);
