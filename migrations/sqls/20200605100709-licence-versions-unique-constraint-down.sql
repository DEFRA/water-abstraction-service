alter table water.licence_versions
  drop constraint uindx_licence_versions_external_id;

alter table water.licence_version_purposes
  drop constraint uindx_licence_version_purposes_external_id;
