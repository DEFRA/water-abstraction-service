/* Replace with your SQL commands */

INSERT INTO "water"."notify_templates" (message_ref, template_id, notify_key)
  VALUES('notification_email', '59bc02ba-a37e-4aa8-a434-573fb85c58e1', 'test')
  ON CONFLICT(message_ref) DO NOTHING;

INSERT INTO "water"."notify_templates" (message_ref, template_id, notify_key)
  VALUES('notification_letter', 'c4b1f147-e357-4f81-b19e-fa686e05a9b1', 'test')
  ON CONFLICT(message_ref) DO NOTHING;

INSERT INTO "water"."scheduler" (task_id, status, task_type, licence_ref, task_config, date_created)
  VALUES(300, 0, 'updateNotificationEvents', '-', '{"count":"2","period":"minute"}', NOW())
  ON CONFLICT(task_type, licence_ref) DO NOTHING;
