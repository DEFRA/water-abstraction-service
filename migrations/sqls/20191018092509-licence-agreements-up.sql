CREATE TABLE IF NOT EXISTS "water"."licence_agreement_types" (
    "licence_agreement_type_id" character varying NOT NULL,
    "description" character varying NOT NULL,
    "date_created" timestamp NOT NULL DEFAULT now(),
    "date_updated" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("licence_agreement_type_id")
);

CREATE TABLE IF NOT EXISTS "water"."licence_agreements" (
    "licence_agreement_id" character varying NOT NULL,
    "licence_ref" character varying NOT NULL,
    "licence_agreement_type_id" character varying NOT NULL,
    "start_date" date NOT NULL,
    "end_date" date,
    "date_created" timestamp NOT NULL DEFAULT now(),
    "date_updated" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("licence_agreement_id"),
    FOREIGN KEY (licence_agreement_type_id) REFERENCES water.licence_agreement_types (licence_agreement_type_id),
    UNIQUE("licence_ref", "start_date", "licence_agreement_type_id")
);