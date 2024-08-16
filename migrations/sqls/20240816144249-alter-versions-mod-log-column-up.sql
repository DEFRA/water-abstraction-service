/*
  Renames the mod_log column and changes its default in each version table

  In [Add mod_log fields 2 return, licence & charge ver.](https://github.com/DEFRA/water-abstraction-service/pull/2598),
  we added a data migration to add a new `mod_log` field to the charge, licence, and return version tables in the
  `water` schema. This field was intended to hold details from the linked NALD mod log record, such as who, when, and
  why the version was created.

  However, we've since learned that a version in NALD can have multiple mod log records. Therefore, we want to change
  the name to make that clear. We also change the default to avoid complexity in the code. Now, it will default to an
  empty JSONB array rather than an empty object.
*/

BEGIN;

ALTER TABLE water.charge_versions RENAME COLUMN mod_log TO mod_logs;
ALTER TABLE water.charge_versions ALTER COLUMN mod_logs SET DEFAULT '[]'::jsonb;
UPDATE water.charge_versions SET mod_logs = '[]'::jsonb WHERE mod_logs = '{}'::jsonb;

ALTER TABLE water.licence_versions RENAME COLUMN mod_log TO mod_logs;
ALTER TABLE water.licence_versions ALTER COLUMN mod_logs SET DEFAULT '[]'::jsonb;
UPDATE water.licence_versions SET mod_logs = '[]'::jsonb WHERE mod_logs = '{}'::jsonb;

ALTER TABLE water.return_versions RENAME COLUMN mod_log TO mod_logs;
ALTER TABLE water.return_versions ALTER COLUMN mod_logs SET DEFAULT '[]'::jsonb;
UPDATE water.return_versions SET mod_logs = '[]'::jsonb WHERE mod_logs = '{}'::jsonb;

COMMIT;
