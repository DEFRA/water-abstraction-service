alter table water.billing_volumes
  alter column calculated_volume type numeric(20,6);

alter table water.billing_volumes
  alter column volume type numeric(20,6);