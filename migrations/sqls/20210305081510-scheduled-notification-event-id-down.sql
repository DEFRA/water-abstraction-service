/* Replace with your SQL commands */
alter table water.scheduled_notification
  drop constraint fk_scheduled_notification_event;


-- Set up index on event type as this is used to query for notifications
drop index idx_event_type;
