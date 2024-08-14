BEGIN;

ALTER TABLE IF EXISTS water.licence_versions ALTER COLUMN date_created SET NOT NULL;
ALTER TABLE IF EXISTS water.licence_versions ALTER COLUMN date_updated SET NOT NULL;

COMMIT;
