alter table water.charge_version_workflows
  add column approved_by jsonb;

alter table water.charge_versions 
  drop column created_by,
  drop column approved_by;