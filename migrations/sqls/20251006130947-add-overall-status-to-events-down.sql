/*
  Remove the overall_status and status_counts columns from the events table

  https://eaflood.atlassian.net/browse/WATER-5306
*/

BEGIN;

ALTER TABLE water.events DROP COLUMN overall_status;
ALTER TABLE water.events DROP COLUMN status_counts;

COMMIT;
