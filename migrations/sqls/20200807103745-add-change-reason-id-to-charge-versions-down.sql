alter table water.charge_versions
  drop column change_reason_id;

alter table water.charge_versions drop constraint if exists charge_versions_change_reason_id_fkey;