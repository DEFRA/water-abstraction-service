alter table water.charge_version_workflows
  drop column approved_by;

alter table water.charge_versions 
  add column created_by jsonb,
  add column approved_by jsonb;