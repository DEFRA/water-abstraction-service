/* drop constraint */
alter table water.licence_agreements
  drop constraint uniq_licence_ref_start_date_financial_agreement_type_id;

/* remove financial_agreement_id column and go back to using code */
alter table water.licence_agreements
  add column financial_agreement_code varchar;

update water.licence_agreements a
  set financial_agreement_code=t.financial_agreement_code
  from water.financial_agreement_types t
  where t.financial_agreement_type_id=a.financial_agreement_type_id;
  
alter table water.licence_agreements
  drop column financial_agreement_type_id;

alter table water.licence_agreements
  rename column financial_agreement_code to financial_agreement_type_id;

/* restore financial agreements table to old structure */
alter table water.financial_agreement_types 
  drop column financial_agreement_type_id;

alter table water.financial_agreement_types
  rename column financial_agreement_code to id;

alter table water.financial_agreement_types
  add primary key(id);

/* restore foreign key constraint */
alter table water.licence_agreements
  add constraint licence_agreements_financial_agreement_type_id_fkey 
    foreign key (financial_agreement_type_id) 
    references water.financial_agreement_types(id);