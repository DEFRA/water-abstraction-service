/* Replace with your SQL commands */
alter table water.scheduled_notification
  drop constraint fk_scheduled_notification_event;

alter table water.scheduled_notification
  alter column event_id type varchar using event_id::varchar;

-- Set up index on event type as this is used to query for notifications
drop index idx_event_type;


-- Convert events table ID back to varchar
alter table water.events 
	alter column event_id type varchar using event_id::varchar;
