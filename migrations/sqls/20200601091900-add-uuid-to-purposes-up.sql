-- on the purposes tables, add a uuid id field and rename the existing
-- unique id from NALD

alter table water.purposes_primary
  drop constraint "purposes_primary_pkey",
  add column "purpose_primary_id" uuid default gen_random_uuid(),
  add primary key ("purpose_primary_id");

alter table water.purposes_primary rename column "id" to "legacy_id";

alter table water.purposes_primary
  add constraint purposes_primary_unq_legacy_id unique (legacy_id);


alter table water.purposes_secondary
  drop constraint "purposes_secondary_pkey",
  add column "purpose_secondary_id" uuid default gen_random_uuid(),
  add primary key ("purpose_secondary_id");

alter table water.purposes_secondary rename column "id" to "legacy_id";

alter table water.purposes_secondary
  add constraint purposes_secondary_unq_legacy_id unique (legacy_id);


alter table water.purposes_uses
  drop constraint "purposes_uses_pkey",
  add column "purpose_use_id" uuid default gen_random_uuid(),
  add primary key ("purpose_use_id");

alter table water.purposes_uses rename column "id" to "legacy_id";

alter table water.purposes_uses
  add constraint purposes_uses_unq_legacy_id unique (legacy_id);


-- now update the charge_elements table to use the new ids

alter table "water"."charge_elements"
  add column "purpose_primary_id" uuid,
  add column "purpose_secondary_id" uuid,
  add column "purpose_tertiary_id" uuid;

-- copy the id data from the purposes tables
update water.charge_elements as ce
set purpose_primary_id = p.purpose_primary_id
from water.purposes_primary as p
where purpose_primary = p.legacy_id;

update water.charge_elements as ce
set purpose_secondary_id = p.purpose_secondary_id
from water.purposes_secondary as p
where purpose_secondary = p.legacy_id;

update water.charge_elements as ce
set purpose_tertiary_id = p.purpose_use_id
from water.purposes_uses as p
where purpose_tertiary = p.legacy_id;


-- remove the unwanted fields and establish foriegn key relationships
-- with the new uuid ids in the purposes tables.
alter table "water"."charge_elements"
  drop column "purpose_primary",
  drop column "purpose_secondary",
  drop column "purpose_tertiary",
  alter column "purpose_primary_id" set not null,
  add foreign key ("purpose_primary_id") references water.purposes_primary("purpose_primary_id"),
  alter column "purpose_secondary_id" set not null,
  add foreign key ("purpose_secondary_id") references water.purposes_secondary("purpose_secondary_id"),
  alter column "purpose_tertiary_id" set not null,
  add foreign key ("purpose_tertiary_id") references water.purposes_uses("purpose_use_id");
