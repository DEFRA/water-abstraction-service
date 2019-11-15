/* Replace with your SQL commands */
CREATE TYPE water.charge_agreement_code AS ENUM ('S126', 'S127', 'INST');

/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS "water"."charge_agreements" (
  "charge_agreement_id" varchar NOT NULL DEFAULT public.gen_random_uuid(),
  "charge_element_id" varchar NOT NULL,
  "agreement_code" water.charge_agreement_code,
  "start_date" date NOT NULL,
  "end_date" date,
  "signed_date" date,
  "file_reference" varchar,
  "description" varchar,
  "date_created" timestamp NOT NULL DEFAULT NOW(),
  "date_updated" timestamp NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("charge_agreement_id"),
  CONSTRAINT charge_element_id FOREIGN KEY (charge_element_id)
    REFERENCES water.charge_elements (charge_element_id) MATCH SIMPLE
    ON DELETE CASCADE
);
