alter table water.scheduled_notification
  add column temp_id varchar;

update water.scheduled_notification
set temp_id = id;

alter table water.scheduled_notification
  drop column id;

alter table water.scheduled_notification
  rename column temp_id to id;

alter table water.scheduled_notification
  add primary key ("id");

alter table water.scheduled_notification
  drop column date_created;
