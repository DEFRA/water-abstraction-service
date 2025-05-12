/* revert changes made */

BEGIN;

ALTER TABLE water.licence_gauging_stations DROP COLUMN created_by;

COMMIT;
