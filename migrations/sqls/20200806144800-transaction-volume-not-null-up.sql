/* Replace with your SQL commands */
update water.billing_transactions set volume=0 where volume is null;

alter table water.billing_transactions 
  alter column volume set not null;