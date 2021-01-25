alter table water.purposes_primary
  drop column if exists is_test;

alter table water.purposes_secondary
  drop column if exists is_test;

alter table water.purposes_uses
  drop column if exists is_test;
