UPDATE water.billing_transactions 
SET is_credited_back = true
WHERE is_credited_back = false and
billing_transaction_id IN (
  SELECT source_transaction_id from water.billing_transactions
);