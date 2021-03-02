/* Replace with your SQL commands */
alter table water.billing_transactions
  drop column source_transaction_id,
  add column transaction_key varchar;
