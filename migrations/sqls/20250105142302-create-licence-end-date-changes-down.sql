/* Revert previous change */

BEGIN;

DROP TABLE IF EXISTS water.licence_end_date_changes;

COMMIT;
