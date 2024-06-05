/* Revert change made to the tables */

BEGIN;

ALTER TABLE IF EXISTS water.return_requirement_points DROP COLUMN nald_point_id;

COMMIT;
