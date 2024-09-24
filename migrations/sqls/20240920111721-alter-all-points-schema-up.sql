/* Replace with your SQL commands */
BEGIN;

CREATE TABLE water.sources (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid() NOT NULL,
  description text NOT NULL,
  source_type text NOT NULL,
  ngr text NOT NULL,
  external_id text NOT NULL,
  legacy_id TEXT NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT sources_external_id_key UNIQUE (external_id)
);

INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('GROUND WATER SOURCE OF SUPPLY', 'Groundwater', 'TL 15000 95000', '1:GWSOS', 'GWSOS');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('SURFACE WATER SOURCE OF SUPPLY', 'Surfacewater', 'TL 15000 95000', '1:SWSOS', 'SWSOS');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('TIDAL WATER SOURCE OF SUPPLY', 'Tidalwater', 'TF 60000 40000', '1:TWSOS', 'TWSOS');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('Surface Water Midlands Region', 'Surfacewater', 'SK 9999 9999', '2:SWMID', 'SWMID');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('Tidal Water Midlands Region', 'Tidalwater', 'SK 9999 9999', '2:TWMID', 'TWMID');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('Groundwater Midlands Region', 'Groundwater', 'SK 9999 9999', '2:GWMID', 'GWMID');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('SURFACE WATER', 'Surfacewater', 'SE 0000 0000', '3:S', 'S');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('TIDAL WATERS', 'Tidalwater', 'SE 0000 0000', '3:T', 'T');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('GROUNDWATERS', 'Groundwater', 'SE 0000 0000', '3:G', 'G');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('Ground Water - North West Region', 'Groundwater', 'SD 60000 60000', '4:GWNW', 'GWNW');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('Surface, Non-Tidal - North West Region', 'Surfacewater', 'SD 60000 60000', '4:SNNW', 'SNNW');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('Surface, Tidal - North West Region', 'Tidalwater', 'SD 30000 70000', '4:STNW', 'STNW');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('South West Region All Surface Waters - Fresh', 'Surfacewater', 'SX 966 917', '5:SWF', 'SWF');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('South West Region All Surface Waters - Saline', 'Surfacewater', 'SX 966 917', '5:SWS', 'SWS');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('South West Region All Ground Waters - Fresh', 'Groundwater', 'SX 966 917', '5:GWF', 'GWF');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('South West Region All Ground Waters - Saline', 'Groundwater', 'SX 966 917', '5:GWS', 'GWS');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('South West Region All Tidal Waters- Fresh', 'Tidalwater', 'SX 966 917', '5:TWF', 'TWF');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('South West Region All Tidal Waters - Saline', 'Tidalwater', 'SX 966 917', '5:TWS', 'TWS');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('Southern Region Surface Waters', 'Surfacewater', 'TQ 700 530', '6:SSW', 'SSW');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('Southern Region Groundwater', 'Groundwater', 'TR 3668 4421', '6:SGW', 'SGW');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('Southern Region Tidal Waters', 'Tidalwater', 'TQ 700 530', '6:STW', 'STW');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('THAMES SURFACE WATER - NON TIDAL', 'Surfacewater', 'SU 80000 90000', '7:SOSSW', 'SOSSW');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('THAMES SURFACE WATER - TIDAL', 'Tidalwater', 'TQ 30000 80000', '7:SOSTW', 'SOSTW');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('THAMES GROUNDWATER', 'Groundwater', 'SU 80000 90000', '7:SOSGW', 'SOSGW');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('EAW Groundwater', 'Groundwater', 'SN 75 19', '8:EAW GW', 'EAW GW');
INSERT INTO water.sources (description, source_type, ngr, external_id, legacy_id) VALUES ('EAW Surface Water', 'Surfacewater', 'SN 46 16', '8:EAW SW', 'EAW SW');

CREATE TABLE water.points (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid() NOT NULL,
  description text NOT NULL,
  ngr_1 text NOT NULL,
  ngr_2 text NULL,
  ngr_3 text NULL,
  ngr_4 text NULL,
  source_id uuid NOT NULL,
  category text NULL,
  primary_type text NULL,
  secondary_type text NULL,
  note text NULL,
  location_note text NULL,
  "depth" decimal DEFAULT 0 NOT NULL,
  bgs_reference text NULL,
  well_reference text NULL,
  hydro_reference text NULL,
  hydro_intercept_distance decimal DEFAULT 0 NOT NULL,
  hydro_offset_distance decimal DEFAULT 0 NOT NULL,
  external_id text NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT points_external_id_key UNIQUE (external_id)
);

-- Because we are adding the columns to existing tables we can't add the NOT NULL constraint
-- We'll have to do this in a subsequent change when we've confirmed the import has run
-- and all records are updated
ALTER TABLE IF EXISTS water.return_requirement_points ALTER COLUMN ngr_1 DROP NOT NULL;
ALTER TABLE IF EXISTS water.return_requirement_points ALTER COLUMN nald_point_id DROP NOT NULL;
ALTER TABLE IF EXISTS water.return_requirement_points ADD COLUMN point_id uuid;

ALTER TABLE IF EXISTS water.licence_version_purpose_points ALTER COLUMN ngr_1 DROP NOT NULL;
ALTER TABLE IF EXISTS water.licence_version_purpose_points ALTER COLUMN nald_point_id DROP NOT NULL;
ALTER TABLE IF EXISTS water.licence_version_purpose_points ADD COLUMN point_id uuid;

COMMIT;
