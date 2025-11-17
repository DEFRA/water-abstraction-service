ALTER TABLE water.events DROP COLUMN automatic;

ALTER TABLE water.scheduled_notification DROP COLUMN due_date;

ALTER TABLE water.scheduled_notification ADD COLUMN alternate_notification_id uuid DEFAULT NULL;
