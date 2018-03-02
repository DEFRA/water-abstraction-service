/* Replace with your SQL commands */
ALTER TABLE "water"."scheduler"
  ADD COLUMN "running_on" varchar;

ALTER TABLE "water"."pending_import"
    ADD COLUMN "date_created" timestamp(0),
    ADD COLUMN "date_updated" timestamp(0),
    ADD COLUMN "log" varchar;

ALTER TABLE "water"."pending_import" ALTER COLUMN date_created SET DEFAULT now();
ALTER TABLE "water"."pending_import" ALTER COLUMN date_updated SET DEFAULT now();
