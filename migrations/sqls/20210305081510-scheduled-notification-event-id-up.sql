-- Set any invalid event_id to null in scheduled_notification table
update water.scheduled_notification
set event_id=null
from (
	select sn.id
	from water.scheduled_notification sn
	where 
	  sn.event_id is not null 
	  and sn.event_id not in (
	  select event_id from water.events
	)
) sn2 where water.scheduled_notification.id=sn2.id;

-- Set up foreign key constraint to events table
alter table water.scheduled_notification
  add constraint fk_scheduled_notification_event foreign key (event_id) references events(event_id);

-- Set up index on event type as this is used to query for notifications
create index idx_event_type on water.events(type);
