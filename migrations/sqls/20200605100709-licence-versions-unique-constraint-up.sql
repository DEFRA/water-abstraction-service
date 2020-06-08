alter table water.licence_versions
  add constraint uindx_licence_versions_external_id unique (external_id);

alter table water.licence_version_purposes
  add constraint uindx_licence_version_purposes unique (
    licence_version_id,
    purpose_primary_id,
    purpose_secondary_id,
    purpose_use_id,
    abstraction_period_start_day,
    abstraction_period_start_month,
    abstraction_period_end_day,
    abstraction_period_end_month
  );
