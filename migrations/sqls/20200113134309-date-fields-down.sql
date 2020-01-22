/* Replace with your SQL commands */
alter table water.billing_transactions 
  alter column start_date type timestamp without time zone;
alter table water.billing_transactions 
  alter column end_date type timestamp without time zone;