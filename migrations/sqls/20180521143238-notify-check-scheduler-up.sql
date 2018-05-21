/* Replace with your SQL commands */
INSERT INTO "water"."scheduler" (task_id, task_type, licence_ref, task_config, date_created, next_run)
  VALUES(301, 'updateNotifyStatus', '-', '{"count":"5","period":"minute"}', NOW(), NOW())
  ON CONFLICT(task_type, licence_ref) DO NOTHING;
