/* Revert change made to the schema */

ALTER TABLE IF EXISTS water.licence_version_purpose_points DROP COLUMN abstraction_method;
