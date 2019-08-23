CREATE TABLE IF NOT EXISTS "water"."purposes_primary" (
    "id" character varying,
    "description" character varying NOT NULL,
    "date_created" timestamp NOT NULL DEFAULT now(),
    "date_updated" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "water"."purposes_secondary" (
    "id" character varying,
    "description" character varying NOT NULL,
    "date_created" timestamp NOT NULL DEFAULT now(),
    "date_updated" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "water"."purposes_uses" (
    "id" character varying,
    "description" character varying NOT NULL,
    "date_created" timestamp NOT NULL DEFAULT now(),
    "date_updated" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
