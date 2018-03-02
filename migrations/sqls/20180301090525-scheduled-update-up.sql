/* Replace with your SQL commands */

INSERT INTO "water"."scheduler"("task_type", "licence_ref", "task_config", "next_run", "last_run", "log", "status", "running")
VALUES ('refreshImport', '-', '{"count":"24","period":"hour"}', '2018-01-01 00:00:00', '2018-03-01 00:00:00', '', 0, 0);
