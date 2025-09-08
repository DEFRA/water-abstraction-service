/*
  We don't revert the fixes we do to the data. But we do drop the columns we added
*/

ALTER TABLE IF EXISTS water.licence_gauging_stations DROP COLUMN notification_id;
ALTER TABLE IF EXISTS water.scheduled_notification DROP COLUMN licence_gauging_station_id;
