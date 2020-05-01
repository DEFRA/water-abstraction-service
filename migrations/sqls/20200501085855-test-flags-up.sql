/* Replace with your SQL commands */
alter table water.regions
   add column is_test boolean not null default false;

alter table water.licences
   add column is_test boolean not null default false;

alter table water.charge_versions
   add column is_test boolean not null default false;

alter table water.charge_elements
   add column is_test boolean not null default false;

alter table water.licence_agreements
   add column is_test boolean not null default false;