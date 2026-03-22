/*
  https://eaflood.atlassian.net/browse/WATER-5538

  Sets the abstraction period back to NULL for all `licence_gauging_stations` records where the abstraction period data
  was previously missing and has been populated by the corresponding `licence_version_purposes` record as part of the up
  migration.
*/

UPDATE water.licence_gauging_stations lgs
SET
	abstraction_period_start_day = NULL,
	abstraction_period_start_month = NULL,
	abstraction_period_end_day = NULL,
	abstraction_period_end_month = NULL
WHERE lgs.licence_version_purpose_condition_id IS NOT NULL;
