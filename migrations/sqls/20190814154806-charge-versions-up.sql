CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TYPE water.charge_scheme AS ENUM ('alcs', 'sroc');
CREATE TYPE water.charge_version_status AS ENUM ('current', 'draft', 'superseded');
CREATE TYPE water.charge_version_source AS ENUM ('nald', 'wrls');
CREATE TYPE water.charge_element_season AS ENUM ('summer', 'winter', 'all year');
CREATE TYPE water.charge_element_source AS ENUM ('supported', 'unsupported', 'kielder', 'tidal');
CREATE TYPE water.charge_element_loss AS ENUM ('high', 'medium', 'low', 'very low', 'non-chargeable');

/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS "water"."charge_versions" (
  "charge_version_id" varchar NOT NULL DEFAULT public.gen_random_uuid(),
  "licence_ref" varchar NOT NULL,
  "scheme" water.charge_scheme NOT NULL,
  "external_id" integer,
  "version_number" integer NOT NULL,
  "start_date" date NOT NULL,
  "status" water.charge_version_status NOT NULL,
  "apportionment" boolean,
  "error" boolean DEFAULT false,
  "end_date" date,
  "billed_upto_date" date,
  "region_code" integer NOT NULL,
  "date_created" timestamp NOT NULL DEFAULT NOW(),
  "date_updated" timestamp NOT NULL DEFAULT NOW(),
  "source" water.charge_version_source NOT NULL,
  PRIMARY KEY ("charge_version_id")
);

CREATE TABLE IF NOT EXISTS "water"."charge_elements" (
  "charge_element_id" varchar NOT NULL DEFAULT public.gen_random_uuid(),
  "charge_version_id" varchar NOT NULL,
  "external_id" integer DEFAULT null,
  "abstraction_period_start_day" smallint NOT NULL,
  "abstraction_period_start_month" smallint NOT NULL,
  "abstraction_period_end_day" smallint NOT NULL,
  "abstraction_period_end_month" smallint NOT NULL,
  "authorised_annual_quantity" numeric NOT NULL,
  "season" water.charge_element_season NOT NULL,
  "season_derived"  water.charge_element_season NOT NULL,
  "source" water.charge_element_source NOT NULL,
  "loss" water.charge_element_loss NOT NULL,
  "purpose_primary" varchar NOT NULL,
  "purpose_secondary" varchar NOT NULL,
  "purpose_tertiary" varchar NOT NULL,
  "factors_overridden" boolean NOT NULL,
  "billable_annual_quantity" numeric,
  "time_limited_start_date" date,
  "time_limited_end_date" date,
  "description" varchar,
  "sroc_category" varchar,
  "date_created" timestamp NOT NULL DEFAULT NOW(),
  "date_updated" timestamp NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("charge_element_id"),
  CONSTRAINT charge_version_id FOREIGN KEY (charge_version_id)
    REFERENCES water.charge_versions (charge_version_id) MATCH SIMPLE
    ON DELETE CASCADE
)
