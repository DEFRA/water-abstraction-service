alter table water.purposes_primary
  add column if not exists is_test boolean not null default false;

alter table water.purposes_secondary
  add column if not exists is_test boolean not null default false;

alter table water.purposes_uses
  add column if not exists is_test boolean not null default false;
