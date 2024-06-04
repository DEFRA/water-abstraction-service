/* Add in missing fields or defaults to make working with the tables easier */

ALTER TABLE IF EXISTS water.return_versions ALTER COLUMN date_created SET DEFAULT NOW();
ALTER TABLE IF EXISTS water.return_versions ALTER COLUMN date_updated SET DEFAULT NOW();
ALTER TABLE IF EXISTS water.return_versions ALTER COLUMN date_updated SET NOT NULL;

ALTER TABLE IF EXISTS water.return_requirements ALTER COLUMN is_summer SET DEFAULT false;
ALTER TABLE IF EXISTS water.return_requirements ALTER COLUMN is_upload SET DEFAULT false;
ALTER TABLE IF EXISTS water.return_requirements ALTER COLUMN date_created SET DEFAULT NOW();
ALTER TABLE IF EXISTS water.return_requirements ALTER COLUMN date_updated SET DEFAULT NOW();
ALTER TABLE IF EXISTS water.return_requirements ALTER COLUMN date_updated SET NOT NULL;

ALTER TABLE IF EXISTS water.return_requirement_points ALTER COLUMN external_id DROP NOT NULL;
ALTER TABLE IF EXISTS water.return_requirement_points ADD COLUMN date_created timestamp NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS water.return_requirement_points ADD COLUMN date_updated timestamp NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS water.return_requirement_purposes ALTER COLUMN date_created SET DEFAULT NOW();
ALTER TABLE IF EXISTS water.return_requirement_purposes ALTER COLUMN date_updated SET DEFAULT NOW();
ALTER TABLE IF EXISTS water.return_requirement_purposes ALTER COLUMN date_updated SET NOT NULL;
