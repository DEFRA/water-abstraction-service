/* Replace with your SQL commands */
INSERT INTO "water"."scheduler" (task_id, status, task_type, licence_ref, task_config, date_created)
  VALUES(301, 0, 'updateNotifyStatus', '-', '{"count":"2","period":"minute"}', NOW())
  ON CONFLICT(task_type, licence_ref) DO NOTHING;
