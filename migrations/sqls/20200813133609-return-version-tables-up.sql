/* Create return versions table */
create type return_version_status as enum('draft', 'superseded', 'current');

create table water.return_versions (
  return_version_id uuid primary key default public.gen_random_uuid(),
  licence_id uuid not null references licences(licence_id),
  version_number integer not null,
  start_date date not null,
  end_date date,
  status return_version_status not null,
  date_created timestamp not null,
  date_updated timestamp,
  external_id varchar,
  unique(external_id)
);

/* Create return requirements table - these show the need to do an individual return each year */
create type returns_frequency as enum('day', 'week', 'fortnight', 'month', 'quarter', 'year');

create table water.return_requirements (
  return_requirement_id uuid primary key default public.gen_random_uuid(),
  return_version_id uuid not null references return_versions(return_version_id),
  returns_frequency returns_frequency not null,
  is_summer boolean not null,
  is_upload boolean not null,
  abstraction_period_start_day smallint,
  abstraction_period_start_month smallint,
  abstraction_period_end_day smallint,
  abstraction_period_end_month smallint,
  site_description varchar,
  description varchar,
  legacy_id integer,
  date_created timestamp not null,
  date_updated timestamp,
  external_id varchar,
  unique(external_id)
);


create table water.return_requirement_purposes (
  return_requirement_purpose_id uuid primary key default public.gen_random_uuid(),
  return_requirement_id uuid not null references return_requirements(return_requirement_id),
  purpose_primary_id uuid not null references purposes_primary(purpose_primary_id),
  purpose_secondary_id uuid not null references purposes_secondary(purpose_secondary_id),
  purpose_use_id uuid not null references purposes_uses(purpose_use_id),
  purpose_alias varchar,
  date_created timestamp not null,
  date_updated timestamp,
  external_id varchar,
  unique(external_id)
);



