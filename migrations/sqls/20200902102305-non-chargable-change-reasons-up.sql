create type water.change_reason_type as enum (
  'new_chargeable_charge_version',
  'new_non_chargeable_charge_version'
);

alter table water.change_reasons
  add column type water.change_reason_type;

update water.change_reasons
set type = 'new_chargeable_charge_version'::water.change_reason_type;

alter table water.change_reasons
  alter column type set not null;

insert into water.change_reasons (description, position, date_created, date_updated, type)
values ('Held by Environment Agency', 100, now(), now(), 'new_non_chargeable_charge_version');

insert into water.change_reasons (description, position, date_created, date_updated, type)
values ('Aggregate licence', 101, now(), now(), 'new_non_chargeable_charge_version');

insert into water.change_reasons (description, position, date_created, date_updated, type)
values ('Chloride content more than 8000 milligrams per litre', 100, now(), now(), 'new_non_chargeable_charge_version');

insert into water.change_reasons (description, position, date_created, date_updated, type)
values ('Abatement (S126)', 102, now(), now(), 'new_non_chargeable_charge_version');

insert into water.change_reasons (description, position, date_created, date_updated, type)
values ('Power generation less than 5 megawatts (S125)', 100, now(), now(), 'new_non_chargeable_charge_version');

insert into water.change_reasons (description, position, date_created, date_updated, type)
values ('Temporary trade', 103, now(), now(), 'new_non_chargeable_charge_version');

insert into water.change_reasons (description, position, date_created, date_updated, type)
values ('Temporary type licence', 104, now(), now(), 'new_non_chargeable_charge_version');

insert into water.change_reasons (description, position, date_created, date_updated, type)
values ('Transfer type licence', 105, now(), now(), 'new_non_chargeable_charge_version');

insert into water.change_reasons (description, position, date_created, date_updated, type)
values ('Shell licence ', 106, now(), now(), 'new_non_chargeable_charge_version');
