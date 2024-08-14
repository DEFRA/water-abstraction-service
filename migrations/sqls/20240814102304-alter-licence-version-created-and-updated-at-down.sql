BEGIN;

ALTER TABLE IF EXISTS water.licence_versions ALTER COLUMN date_created DROP DEFAULT;
ALTER TABLE IF EXISTS water.licence_versions ALTER COLUMN date_updated DROP DEFAULT;

COMMIT;
