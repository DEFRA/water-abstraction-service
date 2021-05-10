/* Replace with your SQL commands */
drop table water.licence_agreement_purpose_uses;

alter table water.charge_elements 
  add column is_section_127_agreement_enabled boolean default true not null;
