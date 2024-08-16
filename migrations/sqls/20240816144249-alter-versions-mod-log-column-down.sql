/* Revert the changes */

BEGIN;

ALTER TABLE water.charge_versions ALTER COLUMN mod_logs SET DEFAULT '{}'::jsonb;
ALTER TABLE water.charge_versions RENAME COLUMN mod_logs TO mod_log;
UPDATE water.charge_versions SET mod_log = '{}'::jsonb WHERE mod_log = '[]'::jsonb;

ALTER TABLE water.licence_versions ALTER COLUMN mod_logs SET DEFAULT '{}'::jsonb;
ALTER TABLE water.licence_versions RENAME COLUMN mod_logs TO mod_log;
UPDATE water.licence_versions SET mod_log = '{}'::jsonb WHERE mod_log = '[]'::jsonb;

ALTER TABLE water.return_versions ALTER COLUMN mod_logs SET DEFAULT '{}'::jsonb;
ALTER TABLE water.return_versions RENAME COLUMN mod_logs TO mod_log;
UPDATE water.return_versions SET mod_log = '{}'::jsonb WHERE mod_log = '[]'::jsonb;

COMMIT;
