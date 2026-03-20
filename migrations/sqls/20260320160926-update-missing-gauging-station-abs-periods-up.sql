/*
  https://eaflood.atlassian.net/browse/WATER-5538

  Previously when a `licence_gauging_stations` record had a `licence_version_purpose_conditions` record associated with
  it the abstraction period data was not stored in the `licence_gauging_stations` table for that record. Instead it was
  derived from the associated `licence_version_purposes` record.

  A decision has been made to now populate the abstraction period data in the `licence_gauging_stations` table,
  regardless if it has a `licence_version_purpose_conditions` record.

  This migration will populate the abstraction period data for all `licence_gauging_stations` records where it is
  currently missing.
*/

UPDATE water.licence_gauging_stations lgs
SET
	abstraction_period_start_day = ap.abstraction_period_start_day,
	abstraction_period_start_month = ap.abstraction_period_start_month,
	abstraction_period_end_day = ap.abstraction_period_end_day,
	abstraction_period_end_month = ap.abstraction_period_end_month
FROM (
	SELECT
		lvpc.licence_version_purpose_condition_id,
		lvp.abstraction_period_start_day,
		lvp.abstraction_period_start_month,
		lvp.abstraction_period_end_day,
		lvp.abstraction_period_end_month
	FROM water.licence_version_purpose_conditions lvpc
	INNER JOIN water.licence_version_purposes lvp
		ON lvpc.licence_version_purpose_id = lvp.licence_version_purpose_id
) ap
WHERE lgs.abstraction_period_start_day IS NULL
AND lgs.licence_version_purpose_condition_id = ap.licence_version_purpose_condition_id;
