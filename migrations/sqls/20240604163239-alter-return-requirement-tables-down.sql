/* Revert changes made to make working with the tables easier */

ALTER TABLE IF EXISTS water.return_versions ALTER COLUMN date_created DROP DEFAULT;
ALTER TABLE IF EXISTS water.return_versions ALTER COLUMN date_updated DROP NOT NULL;
ALTER TABLE IF EXISTS water.return_versions ALTER COLUMN date_updated DROP DEFAULT;

ALTER TABLE IF EXISTS water.return_requirements ALTER COLUMN is_summer DROP DEFAULT;
ALTER TABLE IF EXISTS water.return_requirements ALTER COLUMN is_upload DROP DEFAULT;
ALTER TABLE IF EXISTS water.return_requirements ALTER COLUMN date_created DROP DEFAULT;
ALTER TABLE IF EXISTS water.return_requirements ALTER COLUMN date_updated DROP NOT NULL;
ALTER TABLE IF EXISTS water.return_requirements ALTER COLUMN date_updated DROP DEFAULT;

ALTER TABLE IF EXISTS water.return_requirement_points ALTER COLUMN external_id SET NOT NULL;
ALTER TABLE IF EXISTS water.return_requirement_points DROP COLUMN date_created;
ALTER TABLE IF EXISTS water.return_requirement_points DROP COLUMN date_updated;

ALTER TABLE IF EXISTS water.return_requirement_purposes ALTER COLUMN date_created DROP DEFAULT;
ALTER TABLE IF EXISTS water.return_requirement_purposes ALTER COLUMN date_updated DROP NOT NULL;
ALTER TABLE IF EXISTS water.return_requirement_purposes ALTER COLUMN date_updated DROP DEFAULT;
