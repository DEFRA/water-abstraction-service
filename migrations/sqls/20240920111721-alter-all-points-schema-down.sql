/* Revert change made to the schema */
BEGIN;

ALTER TABLE IF EXISTS water.licence_version_purpose_points DROP COLUMN point_id;
ALTER TABLE water.licence_version_purpose_points ALTER COLUMN ngr_1 SET NOT NULL;
ALTER TABLE water.licence_version_purpose_points ALTER COLUMN nald_point_id SET NOT NULL;

ALTER TABLE IF EXISTS water.return_requirement_points DROP COLUMN point_id;
ALTER TABLE water.return_requirement_points ALTER COLUMN ngr_1 SET NOT NULL;
ALTER TABLE water.return_requirement_points ALTER COLUMN nald_point_id SET NOT NULL;

DROP TABLE IF EXISTS water.points;
DROP TABLE IF EXISTS water.sources;

COMMIT;
