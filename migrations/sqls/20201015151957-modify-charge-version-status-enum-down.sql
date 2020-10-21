alter type water.charge_version_workflow_status
  rename to _charge_version_workflow_status;

-- Re-create the old ENUM validation type
create type water.charge_version_workflow_status as enum (
  'draft',
  'changes_requested'
);

-- Set the status column type to varchar, temporarily
ALTER TABLE water.charge_version_workflows ALTER COLUMN status TYPE varchar USING status::varchar;

-- Update the column values
update water.charge_version_workflows SET status='draft' WHERE status='review';

-- Set the column to ENUM again
alter table water.charge_version_workflows
  alter column status type water.charge_version_workflow_status using status::text::water.charge_version_workflow_status;

-- Drop the old type
drop type water._charge_version_workflow_status;
