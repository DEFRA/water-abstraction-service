UPDATE water.licence_gauging_stations SET date_status_updated = NOW() WHERE date_status_updated IS NULL;
ALTER TABLE water.licence_gauging_stations ALTER COLUMN date_status_updated SET NOT NULL;
