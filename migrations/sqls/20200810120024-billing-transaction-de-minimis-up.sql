/* Replace with your SQL commands */
alter table water.billing_transactions
  add column is_de_minimis boolean default false not null;