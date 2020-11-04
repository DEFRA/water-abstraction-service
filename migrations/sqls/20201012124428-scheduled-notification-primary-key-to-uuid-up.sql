alter table water.scheduled_notification
  add column "temp_id" uuid not null default public.gen_random_uuid();

update water.scheduled_notification
set temp_id = id::uuid WHERE length(id::text)=36;

update water.scheduled_notification
set temp_id = public.gen_random_uuid() WHERE length(id::text)<>36;

alter table water.scheduled_notification
  drop column "id";

alter table water.scheduled_notification
  rename column temp_id to id;

alter table water.scheduled_notification
  add primary key ("id");

alter table water.scheduled_notification
  add column if not exists date_created timestamp;
