
/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS "water"."charge_purposes" (
    "charge_purpose_id" uuid NOT NULL DEFAULT public.gen_random_uuid(),
    "charge_element_id" uuid NOT NULL,
    "abstraction_period_start_day" smallint NOT NULL,
    "abstraction_period_start_month" smallint NOT NULL,
    "abstraction_period_end_day" smallint NOT NULL,
    "abstraction_period_end_month" smallint NOT NULL,
    "authorised_annual_quantity" numeric NOT NULL,
    "season" water.charge_element_season NOT NULL,
    "season_derived" water.charge_element_season NOT NULL,
    "source" water.charge_element_source NOT NULL,
    "loss" water.charge_element_loss NOT NULL,
    "factors_overridden" boolean NOT NULL,
    "billable_annual_quantity" numeric,
    "time_limited_start_date" date,
    "time_limited_end_date" date,
    "description" varchar,
    "date_created" timestamp NOT NULL DEFAULT NOW(),
    "date_updated" timestamp NOT NULL DEFAULT NOW(),
    "is_test" boolean DEFAULT false NOT NULL,
    "purpose_primary_id" uuid not null,
    "purpose_secondary_id" uuid not null,
    "purpose_use_id" uuid not null,
    "is_section_127_agreement_enabled" boolean DEFAULT true NOT NULL,
    PRIMARY KEY ("charge_purpose_id"),
    CONSTRAINT "charge_purposes_charge_element_id" FOREIGN KEY (charge_element_id)
        REFERENCES water.charge_elements (charge_element_id) MATCH SIMPLE
        ON DELETE CASCADE
);

-- add foriegn key relationships pointing to the purposes tables.
alter table "water"."charge_purposes"
  add foreign key ("purpose_primary_id") references water.purposes_primary("purpose_primary_id"),
  add foreign key ("purpose_secondary_id") references water.purposes_secondary("purpose_secondary_id"),
  add foreign key ("purpose_use_id") references water.purposes_uses("purpose_use_id");