CREATE TABLE "water"."events" (
  "event_id" varchar NOT NULL,
  "reference_code" varchar,
  "type" varchar NOT NULL,
  "subtype" varchar,
  "issuer" varchar,
  "licences" jsonb,
  "entities" jsonb,
  "comment" varchar,
  "metadata" jsonb,
  "status" varchar,
  "created" timestamp(0) ,
  "modified" timestamp(0),
  PRIMARY KEY ("event_id")
)
;

ALTER TABLE "water"."scheduled_notification"
  ADD COLUMN "licences" jsonb,
  ADD COLUMN "individual_entity_id" varchar,
  ADD COLUMN "company_entity_id" varchar,
  ADD COLUMN "medium" varchar,
  ADD COLUMN "notify_id" varchar,
  ADD COLUMN "notify_status" varchar,
  ADD COLUMN "plaintext" varchar,
  ADD COLUMN "event_id" varchar,
  ADD COLUMN "metadata" jsonb;
