/* Replace with your SQL commands */
/* Replace with your SQL commands */
INSERT INTO "water"."scheduler" (task_id, status, task_type, licence_ref, task_config, date_created, next_run)
  VALUES(302, 0, 'refreshGaugingStations', '-', '{"count":"1","period":"day"}', NOW(), NOW())
  ON CONFLICT(task_type, licence_ref) DO NOTHING;
