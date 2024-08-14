/* Replace with your SQL commands */
BEGIN;

ALTER TABLE IF EXISTS water.licence_version_purposes ALTER COLUMN date_created SET NOT NULL;
ALTER TABLE IF EXISTS water.licence_version_purposes ALTER COLUMN date_updated SET NOT NULL;

COMMIT;
