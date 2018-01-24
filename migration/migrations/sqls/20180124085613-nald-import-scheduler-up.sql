/* Replace with your SQL commands */

CREATE TABLE "water"."scheduler" (
  "task_id" SERIAL,
  "task_type" varchar NOT NULL,
  "licence_ref" varchar NOT NULL,
  "task_config" varchar,
  "next_run" timestamp(0),
  "last_run" timestamp(0),
  "log" varchar,
  "status" smallint,
  "running" smallint default 0,
  "date_created" timestamp(0),
  "date_updated" timestamp(0),

  PRIMARY KEY ("task_type","licence_ref")
)
;

ALTER TABLE "water"."scheduler" ALTER COLUMN date_created SET DEFAULT now();
ALTER TABLE "water"."scheduler" ALTER COLUMN date_updated SET DEFAULT now();
