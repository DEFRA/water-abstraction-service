/*
  Amend return_requirement_points table

  We add a new column that will allow us to capture the NALD point ID. This is intended to support future reporting
  requirements where our users need to be able to identify which specific points a return submission (return log)
  relates to.

  The submissions (returns.returns) link to `water.return_requirements` which in turn is linked to
  `water.return_requirement_points`. If that table contains the NALD point ID then they should be able to link
  submissions to specific points.

  We also missed in our tidy up of that return requirement tables that one of the fields we added has a typo. So, we
  fix that as well.
*/

BEGIN;

-- Because we are adding the column to an existing table we can't add the NOT NULL constraint yet
ALTER TABLE IF EXISTS water.return_requirement_points ADD COLUMN nald_point_id INTEGER;
-- Update all the records with the point ID which we can extract from the external ID we generate
UPDATE water.return_requirement_points SET nald_point_id = split_part(external_id, ':', 3)::int;
-- Now apply the NOT NULL constraint so we can ensure it is always populated in future
ALTER TABLE IF EXISTS water.return_requirement_points ALTER COLUMN nald_point_id  SET NOT NULL;

-- Correct the column name typo
ALTER TABLE IF EXISTS water.return_requirements RENAME COLUMN fixty_six_exception TO fifty_six_exception;

COMMIT;
