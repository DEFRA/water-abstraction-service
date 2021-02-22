ALTER TABLE water.charge_version_workflows
DROP CONSTRAINT IF EXISTS unique_licence_version_id,
DROP COLUMN IF EXISTS licence_version_id,
DROP COLUMN IF EXISTS date_deleted;