/* Replace with your SQL commands */
  CREATE TABLE IF NOT EXISTS "water"."licence_version_purpose_condition_types" (
    "licence_version_purpose_condition_type_id" uuid PRIMARY KEY default public.gen_random_uuid(),
    "code" VARCHAR NOT NULL,
    "subcode" VARCHAR NOT NULL,
    "description" VARCHAR NOT NULL,
    "subcode_description" VARCHAR NULL,
    "date_created" TIMESTAMP NOT NULL DEFAULT NOW(),
    "date_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "uidx_code_subcode" unique ("code", "subcode")
);

CREATE TABLE IF NOT EXISTS "water"."licence_version_purpose_conditions" (
  "licence_version_purpose_condition_id" uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  "licence_version_purpose_id" uuid NOT NULL,
  "licence_version_purpose_condition_type_id" uuid NOT NULL,
  "param_1" VARCHAR,
  "param_2" VARCHAR,
  "notes" VARCHAR,
  "external_id" VARCHAR NOT NULL,
  "date_created" timestamp NOT NULL DEFAULT NOW(),
  "date_updated" timestamp NOT NULL DEFAULT NOW(),
    CONSTRAINT "uidx_external_id" unique ("external_id"),
    CONSTRAINT "licence_version_purpose_id" FOREIGN KEY ("licence_version_purpose_id")
    REFERENCES "water"."licence_version_purposes" ("licence_version_purpose_id") MATCH SIMPLE,
  CONSTRAINT "licence_version_purpose_condition_type_id" FOREIGN KEY ("licence_version_purpose_condition_type_id")
    REFERENCES "water"."licence_version_purpose_condition_types" ("licence_version_purpose_condition_type_id") MATCH SIMPLE
);
