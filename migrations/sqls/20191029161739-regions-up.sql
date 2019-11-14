create table water.regions (
  region_id uuid primary key default public.gen_random_uuid(),
  charge_region_id character varying not null,
  nald_region_id integer not null,
  name character varying not null,
  date_created timestamp not null default now(),
  date_updated timestamp not null default now()
);

insert into water.regions
  (charge_region_id, nald_region_id, name)
values
  ('A', 1, 'Anglian'),
  ('B', 2, 'Midlands'),
  ('Y', 3, 'North East'),
  ('N', 4, 'North West'),
  ('E', 5, 'South West'),
  ('S', 6, 'Southern'),
  ('T', 7, 'Thames'),
  ('W', 8, 'EA Wales');
