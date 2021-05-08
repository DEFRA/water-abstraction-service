-- Drop the current constraint and id column
ALTER TABLE water.gauging_stations DROP CONSTRAINT gauging_stations_pkey;
ALTER TABLE water.gauging_stations DROP COLUMN id;

-- Add the new primary key
ALTER TABLE water.gauging_stations ADD COLUMN gauging_station_id uuid DEFAULT public.gen_random_uuid();
ALTER TABLE water.gauging_stations ADD PRIMARY KEY (gauging_station_id);

-- Add a new Unique col called hydrology_station_id to hold the external guids
ALTER TABLE water.gauging_stations ADD COLUMN hydrology_station_id uuid UNIQUE;

-- Rename timestamp columns to match convention
ALTER TABLE water.gauging_stations RENAME COLUMN created TO date_created;
ALTER TABLE water.gauging_stations RENAME COLUMN modified TO date_updated;
