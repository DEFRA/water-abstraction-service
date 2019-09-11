/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS "water"."financial_agreement_types" (
    "id" character varying,
    "description" character varying NOT NULL,
    "disabled" boolean DEFAULT false,
    "date_created" timestamp NOT NULL DEFAULT now(),
    "date_updated" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);


/* stop using enum type in charge agreements */
ALTER TABLE water.charge_agreements
   ALTER COLUMN agreement_code TYPE character varying;

DROP TYPE IF EXISTS water.charge_agreement_code;
