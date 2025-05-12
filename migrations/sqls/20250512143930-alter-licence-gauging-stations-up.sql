/*
  Adds a column to allow us to capture who created the record

  We capture the user_id so we can link to the idm.users table
*/

BEGIN;

ALTER TABLE water.licence_gauging_stations ADD created_by integer;

COMMIT;
