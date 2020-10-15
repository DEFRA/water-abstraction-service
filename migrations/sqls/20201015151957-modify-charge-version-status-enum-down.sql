alter type water.charge_version_workflow_status
  rename to _charge_version_workflow_status;

create type water.charge_version_workflow_status as enum (
  'draft',
  'changes_requested'
);

alter table water.charge_version_workflow
  alter column status type water.charge_version_workflow_status using status::text::water.charge_version_workflow_status;

drop type water._charge_version_workflow_status_old;
