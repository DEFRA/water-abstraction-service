CREATE TABLE "water"."lookup" (
  "lookup_id" varchar NOT NULL,
  "type" varchar NOT NULL,
  "key" varchar NOT NULL,
  "value" varchar,
  "metadata" jsonb,
  "created" timestamp(0),
  "modified" timestamp(0),
  PRIMARY KEY(lookup_id)
);
