-- Change the type
alter type water.charge_version_workflow_status
  rename to _charge_version_workflow_status;

-- Create the new ENUM validation type
create type water.charge_version_workflow_status as enum (
  'review',
  'changes_requested'
);

-- Set the status column type to varchar, temporarily
ALTER TABLE water.charge_version_workflows ALTER COLUMN status TYPE varchar USING status::varchar;

-- Update the column values
update water.charge_version_workflows SET status='review' WHERE status='draft';

-- Set the status column to use the ENUM
alter table water.charge_version_workflows
  alter column status type water.charge_version_workflow_status using status::text::water.charge_version_workflow_status;

-- Drop the old enum type
drop type water._charge_version_workflow_status;
