SELECT '§§§§§§§§1';
SELECT * FROM information_schema.columns WHERE table_schema = 'water' AND table_name = 'licences';

create table IF NOT EXISTS water.licences (
  licence_id uuid primary key default public.gen_random_uuid(),
  region_id uuid not null
    constraint licences_region_id_fkey
    references water.regions (region_id),
  licence_ref varchar not null,
  include_in_supplementary_billing boolean not null default false
);

alter table water.billing_transactions
  drop column licence_ref;
