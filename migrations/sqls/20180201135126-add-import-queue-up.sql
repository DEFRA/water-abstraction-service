/* Replace with your SQL commands */
DROP TABLE IF EXISTS "pending_import";
CREATE TABLE "pending_import" (
  "licence_ref" varchar NOT NULL,
  "status" int2
);

INSERT INTO "water"."scheduler"
("task_type", "licence_ref", "task_config", "next_run", "last_run", "log", "status", "running") VALUES ('import', '-', '{"count":1,"period":"minute"}', '2018-01-01', '2018-01-01', '{"error":null}', NULL, 0)
;
