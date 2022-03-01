create table water.notes (
    note_id uuid primary key default public.gen_random_uuid(),
    text varchar(500) not null,
    date_created timestamp not null default now(),
    date_updated timestamp not null default now(),
    user_id integer not null,
    type varchar not null,
    type_id uuid not null,
    licence_id uuid null references licences(licence_id)
);

alter table water.charge_versions add column note_id uuid null;

alter table water.charge_versions
    add constraint charge_version_note_id_fkey
        foreign key (note_id)
            references water.notes (note_id)
                match simple
            on delete cascade;
