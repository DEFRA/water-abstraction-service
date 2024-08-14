/* Replace with your SQL commands */
BEGIN;

ALTER TABLE IF EXISTS water.licence_version_purposes ALTER COLUMN date_created DROP DEFAULT;
ALTER TABLE IF EXISTS water.licence_version_purposes ALTER COLUMN date_updated DROP DEFAULT;

COMMIT;
