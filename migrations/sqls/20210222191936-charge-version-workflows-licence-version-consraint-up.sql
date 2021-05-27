-- Set the status column type to varchar, temporarily to drop and recreate the enum type
ALTER TABLE water.charge_version_workflows ALTER COLUMN status TYPE varchar USING status::varchar;
DROP TYPE IF EXISTS water.charge_version_workflow_status;

-- recreate the enum type with the new value added
CREATE TYPE water.charge_version_workflow_status as enum('review', 'changes_requested', 'to_setup');

-- set the enum type for the status column
ALTER TABLE water.charge_version_workflows
  ALTER COLUMN status TYPE water.charge_version_workflow_status
  USING status::text::water.charge_version_workflow_status;

-- add the new collumns and the remove the created_by not null constraint
ALTER TABLE water.charge_version_workflows
ADD COLUMN licence_version_id UUID,
ADD COLUMN date_deleted TIMESTAMP DEFAULT NULL,
ALTER COLUMN created_by DROP NOT NULL;

-- create a temp table to store the top licence version for each licence
CREATE TEMP TABLE tmp_top_licence_versions AS
(SELECT * FROM
 (SELECT *, rank() OVER (PARTITION BY licence_id ORDER BY ranked DESC)
  FROM (SELECT *,LPAD(concat(issue, increment)::TEXT, 9, '0') AS ranked FROM water.licence_versions) AS lvs) AS rankedLicences
WHERE rank = 1);

-- update the table with the licence_version_id selecting the latest version for each licence
UPDATE water.charge_version_workflows cw  SET
licence_version_id = lv.licence_version_id
FROM tmp_top_licence_versions lv
WHERE lv.licence_id = cw.licence_id;

-- remove the temp table
DROP TABLE tmp_top_licence_versions;

-- this is precautionary
-- if the migration ran and the cron job created workflows, the migration was then reverted this will then rectify those records
UPDATE water.charge_version_workflows SET
status = 'to_setup',
created_by = NULL
WHERE created_by = '{"id": 0, "email": "wrls@admin.com"}';

-- create the unique constraint
ALTER TABLE water.charge_version_workflows
ADD CONSTRAINT unique_licence_version_id_date_deleted UNIQUE (licence_version_id, date_deleted);
