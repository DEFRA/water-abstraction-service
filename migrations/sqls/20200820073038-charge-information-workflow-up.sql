/* Replace with your SQL commands */
create type charge_version_workflow_status as enum('draft', 'changes_requested');

create table water.charge_version_workflows (
  charge_version_workflow_id uuid primary key default public.gen_random_uuid(),
  licence_id uuid not null references licences(licence_id),
  created_by jsonb not null,
  approved_by jsonb,
  approver_comments varchar,
  status charge_version_workflow_status not null,
  data jsonb,
  date_created timestamp not null,
  date_updated timestamp
);
