/* Replace with your SQL commands */
drop table water.licence_agreement_purpose_uses;

alter table water.charge_elements 
  add column is_section_127_agreement_enabled boolean default true not null;

/* Remove legacy ID column */
alter table water.licence_agreements 
  drop column external_id;

/* Add source column */
create type water.licence_agreement_source AS ENUM ('nald', 'wrls');
alter table water.licence_agreements
  add column source water.licence_agreement_source default 'wrls' not null;

/* Initially set all records to "NALD" source */
update water.licence_agreements set source='nald';
