/* Replace with your SQL commands */

CREATE TABLE "water"."task_config" (
  "task_config_id" SERIAL PRIMARY KEY,
  "type" varchar NOT NULL,
  "config" jsonb,
  "created" timestamp(0),
  "modified" timestamp(0)
);
