/* Replace with your SQL commands */


ALTER TABLE "water"."scheduler"
  ADD COLUMN last_run_started timestamp(0) without time zone;
