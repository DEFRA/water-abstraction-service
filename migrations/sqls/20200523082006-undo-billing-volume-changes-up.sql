/* Replace with your SQL commands */
drop table water.billing_volumes;

alter table water.billing_transactions
  add column calculated_volume numeric,
  add column two_part_tariff_error boolean,
  add column two_part_tariff_status integer,
  add column two_part_tariff_review jsonb;