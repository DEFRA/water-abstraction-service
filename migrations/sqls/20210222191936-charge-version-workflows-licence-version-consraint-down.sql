-- Set the status column type to varchar, temporarily
ALTER TABLE water.charge_version_workflows ALTER COLUMN status TYPE varchar USING status::varchar;

-- set the status to 'review' and user to a temp admin email for all the records that was created by the cron job
UPDATE water.charge_version_workflows
SET status = 'review',
created_by = '{"id": 0, "email": "wrls@admin.com"}'
WHERE status = 'to_setup';

-- remove columns no longer needed
ALTER TABLE water.charge_version_workflows
DROP CONSTRAINT IF EXISTS unique_licence_version_id,
DROP COLUMN IF EXISTS licence_version_id,
DROP COLUMN IF EXISTS date_deleted,
ALTER COLUMN created_by SET NOT NULL;

-- remove the enum type
DROP TYPE IF EXISTS water.charge_version_workflow_status;
-- recreate the enum type with the new values
CREATE TYPE water.charge_version_workflow_status as enum('review', 'changes_requested');

-- change the status type back to the enum
ALTER TABLE water.charge_version_workflows
  ALTER COLUMN status TYPE water.charge_version_workflow_status
  USING status::text::water.charge_version_workflow_status;
