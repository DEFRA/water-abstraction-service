/* Replace with your SQL commands */

alter table water.billing_transactions
  add column source_transaction_id uuid 
  default null
  constraint billing_transactions_billing_transactions_fk_source_transaction_id references water.billing_transactions (billing_transaction_id);
