-- no live task will currently populate licences
-- so this is required for developers who may have
-- licence data for local testing.
truncate water.licences cascade;

alter table water.licences
  add column is_water_undertaker boolean not null,
  add column regions jsonb not null,
  add column date_created timestamp not null default now(),
  add column date_updated timestamp not null default now(),
  add constraint c_licences_lic_ref_region unique (region_id, licence_ref);
