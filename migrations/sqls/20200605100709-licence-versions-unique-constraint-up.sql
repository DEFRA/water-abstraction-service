alter table water.licence_versions
  add constraint uindx_licence_versions_external_id unique (external_id);

truncate table water.licence_version_purposes;

alter table water.licence_version_purposes
  add column "external_id" varchar not null;

alter table water.licence_version_purposes
  add constraint uindx_licence_version_purposes_external_id unique (external_id);
