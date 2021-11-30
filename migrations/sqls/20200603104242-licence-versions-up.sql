create type water.licence_version_status as enum (
  'draft',
  'current',
  'superseded'
);

create table water.licence_versions (
  "licence_version_id" uuid default public.gen_random_uuid(),
  "licence_id" uuid not null,
  "issue" integer not null,
  "increment" integer not null,
  "status" water.licence_version_status not null,
  "start_date" date not null,
  "end_date" date,
  "external_id" varchar not null,
  "date_created" timestamp not null,
  "date_updated" timestamp not null,
  primary key ("licence_version_id"),
  foreign key ("licence_id") references water.licences("licence_id")
);

create table water.licence_version_purposes (
  "licence_version_purpose_id" uuid default public.gen_random_uuid(),
  "licence_version_id" uuid not null,
  "purpose_primary_id" uuid not null,
  "purpose_secondary_id" uuid not null,
  "purpose_use_id" uuid not null,
  "abstraction_period_start_day" smallint not null,
  "abstraction_period_start_month" smallint not null,
  "abstraction_period_end_day" smallint not null,
  "abstraction_period_end_month" smallint not null,
  "time_limited_start_date" date,
  "time_limited_end_date" date,
  "notes" text,
  "annual_quantity" numeric,
  "date_created" timestamp not null,
  "date_updated" timestamp not null,
  primary key ("licence_version_purpose_id"),
  foreign key ("licence_version_id") references water.licence_versions("licence_version_id"),
  foreign key ("purpose_primary_id") references water.purposes_primary("purpose_primary_id"),
  foreign key ("purpose_secondary_id") references water.purposes_secondary("purpose_secondary_id"),
  foreign key ("purpose_use_id") references water.purposes_uses("purpose_use_id")
);
