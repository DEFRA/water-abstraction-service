ALTER TABLE water.billing_batches 
RENAME COLUMN external_id TO bill_run_id;

ALTER TABLE water.billing_batches 
ADD COLUMN external_id uuid;

