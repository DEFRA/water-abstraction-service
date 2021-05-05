/* Replace with your SQL commands */
drop table water.licence_agreement_purpose_uses;

alter table water.licence_agreements 
  drop column external_id;

alter table water.licence_agreements 
  alter column licence_agreement_id type varchar using licence_agreement_id::varchar;

  