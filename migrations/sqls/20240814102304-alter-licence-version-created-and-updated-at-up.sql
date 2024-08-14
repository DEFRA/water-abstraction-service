/*
  Alters the licence_versions table to set the default created at and updated at to date now
*/

BEGIN;

ALTER TABLE IF EXISTS water.licence_versions ALTER COLUMN date_created SET DEFAULT now();
ALTER TABLE IF EXISTS water.licence_versions ALTER COLUMN date_updated SET DEFAULT now();

COMMIT;
