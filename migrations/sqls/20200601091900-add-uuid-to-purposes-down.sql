alter table water.charge_elements
  add column "purpose_primary" varchar,
  add column "purpose_secondary" varchar,
  add column "purpose_tertiary" varchar;

update water.charge_elements as ce
set purpose_primary = p.legacy_id
from water.purposes_primary as p
where ce.purpose_primary_id = p.purpose_primary_id;

update water.charge_elements as ce
set purpose_secondary = p.legacy_id
from water.purposes_secondary as p
where ce.purpose_secondary_id = p.purpose_secondary_id;

update water.charge_elements as ce
set purpose_tertiary = p.legacy_id
from water.purposes_uses as p
where ce.purpose_tertiary_id = p.purpose_use_id;


alter table water.charge_elements
  drop column "purpose_primary_id",
  drop column "purpose_secondary_id",
  drop column "purpose_tertiary_id",
  alter column "purpose_primary" set not null,
  alter column "purpose_secondary" set not null,
  alter column "purpose_tertiary" set not null;


alter table water.purposes_primary rename column "legacy_id" to "id";

alter table water.purposes_primary
  drop column "purpose_primary_id",
  add primary key ("id");

alter table water.purposes_secondary rename column "legacy_id" to "id";

alter table water.purposes_secondary
  drop column "purpose_secondary_id",
  add primary key ("id");

alter table water.purposes_primary
  drop constraint if exists purposes_primary_unq_legacy_id;

alter table water.purposes_secondary
  drop constraint if exists purposes_secondary_unq_legacy_id;

alter table water.purposes_uses
  drop constraint if exists purposes_uses_unq_legacy_id;

alter table water.purposes_uses rename column "legacy_id" to "id";

alter table water.purposes_uses
  drop column "purpose_use_id",
  add primary key ("id");


