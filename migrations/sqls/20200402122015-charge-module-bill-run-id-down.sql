/* Replace with your SQL commands */
ALTER TABLE water.billing_batches 
DROP COLUMN external_id;

ALTER TABLE water.billing_batches 
RENAME COLUMN bill_run_id TO external_id;

