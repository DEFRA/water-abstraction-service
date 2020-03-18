alter table water.billing_transactions
  drop column calculated_volume,
  drop column two_part_tariff_error,
  drop column two_part_tariff_status,
  drop column two_part_tariff_review;
