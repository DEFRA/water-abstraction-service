/*
  Adds a column to allow us to capture who created the version

  We capture the user_id so we can link to the idm.users record of the use who created the return version and
  accompanying records
*/

BEGIN;

ALTER TABLE water.return_versions ADD created_by integer;

COMMIT;
