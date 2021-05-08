-- Drop the current constraint and id column
ALTER TABLE water.gauging_stations DROP CONSTRAINT gauging_stations_pkey;
ALTER TABLE water.gauging_stations DROP COLUMN gauging_station_id;

-- Add the new primary key
ALTER TABLE water.gauging_stations ADD COLUMN id varchar;
UPDATE water.gauging_stations gs SET id = gs.metadata->>'@id';
ALTER TABLE water.gauging_stations ADD PRIMARY KEY (id);

-- Add a new Unique col called hydrology_station_id to hold the external guids
ALTER TABLE water.gauging_stations DROP CONSTRAINT gauging_stations_hydrology_station_id_key;
ALTER TABLE water.gauging_stations DROP COLUMN hydrology_station_id;

-- Reverse the renaming of timestamp columns to match convention
ALTER TABLE water.gauging_stations RENAME COLUMN date_created TO created;
ALTER TABLE water.gauging_stations RENAME COLUMN date_updated TO modified;
