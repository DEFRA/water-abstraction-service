/* Revert change made to the tables */

BEGIN;

ALTER TABLE IF EXISTS water.return_requirement_points DROP COLUMN nald_point_id;

ALTER TABLE IF EXISTS water.return_requirements RENAME COLUMN fifty_six_exception TO fixty_six_exception;

COMMIT;
