/* Replace with your SQL commands */
/* Delete task which imports all licences */
DELETE FROM "water"."scheduler";

INSERT INTO "water"."scheduler"
("task_type", "licence_ref", "task_config", "next_run", "last_run", "log", "status", "running") VALUES ('import', '-', '{"count":1,"period":"minute"}', '2018-01-01', '2018-01-01', '{"error":null}', NULL, 0)
;

DELETE FROM "water"."pending_import";
