alter table water.charge_versions drop constraint charge_version_note_id_fkey;
alter table water.charge_versions drop column note_id;
drop table water.notes;