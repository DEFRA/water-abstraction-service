/*
  https://eaflood.atlassian.net/browse/WATER-5306

  Remove the changes we made to the water.events table.

  We retain the changes made to the data as we consider those data fixes.
*/

BEGIN;

-- 1. Drop the new columns we added
ALTER TABLE IF EXISTS water.events DROP COLUMN overall_status;
ALTER TABLE IF EXISTS water.events DROP COLUMN status_counts;
ALTER TABLE IF EXISTS water.events DROP COLUMN updated_at;

-- 2. Drop the changes we made to the created column
ALTER TABLE IF EXISTS water.events ALTER COLUMN created DROP DEFAULT;
ALTER TABLE IF EXISTS water.events ALTER COLUMN created DROP NOT NULL;

COMMIT;
