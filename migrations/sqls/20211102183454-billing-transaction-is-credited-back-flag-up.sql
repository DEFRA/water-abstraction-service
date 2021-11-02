ALTER TABLE water.billing_transactions
ADD COLUMN is_credited_back boolean default null;

UPDATE water.billing_transactions 
SET is_credited_back = true
WHERE billing_transaction_id IN (
  SELECT source_transaction_id from water.billing_transactions
);