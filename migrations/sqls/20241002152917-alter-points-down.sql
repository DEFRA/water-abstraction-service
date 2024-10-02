/* Revert change made to the schema */

ALTER TABLE IF EXISTS water.points DROP COLUMN abstraction_method;
