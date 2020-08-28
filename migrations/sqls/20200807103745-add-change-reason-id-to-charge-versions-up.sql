alter table water.charge_versions
  add column if not exists change_reason_id uuid;

alter table water.charge_versions drop constraint if exists charge_versions_change_reason_id_fkey;

alter table water.charge_versions
  add constraint charge_versions_change_reason_id_fkey
    foreign key(change_reason_id)
    references water.change_reasons (change_reason_id);