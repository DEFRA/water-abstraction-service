/* Replace with your SQL commands */

CREATE TABLE "water"."gauging_stations" (
  "id" VARCHAR NOT NULL,
  "label" VARCHAR NOT NULL,
  "lat" DECIMAL,
  "long" DECIMAL,
  "easting" BIGINT,
  "northing" BIGINT,
  "grid_reference" VARCHAR,
  "catchment_name" VARCHAR,
  "river_name" VARCHAR,
  "wiski_id" VARCHAR,
  "station_reference" VARCHAR,
  "status" VARCHAR,
  "metadata" jsonb,
  "created" timestamp(0) without time zone,
  "modified" timestamp(0) without time zone,
  PRIMARY KEY ("id")
)
;
