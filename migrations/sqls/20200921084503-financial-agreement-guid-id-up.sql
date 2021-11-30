/* Replace with your SQL commands */


/* remove foreign key constraints */
alter table water.licence_agreements
  drop constraint licence_agreements_financial_agreement_type_id_fkey;

/* modify financial agreement types table */
alter table water.financial_agreement_types
  drop constraint financial_agreement_types_pkey;

alter table water.financial_agreement_types
  rename column id to financial_agreement_code;

alter table water.financial_agreement_types
  add column financial_agreement_type_id uuid default public.gen_random_uuid() not null;

alter table water.financial_agreement_types
  add primary key(financial_agreement_type_id);

/* modify water.licence_agreements table to use guid column */
alter table water.licence_agreements
  rename financial_agreement_type_id to financial_agreement_code;

alter table water.licence_agreements
  add column financial_agreement_type_id uuid references water.financial_agreement_types(financial_agreement_type_id);

update water.licence_agreements a
  set financial_agreement_type_id=t.financial_agreement_type_id
  from water.financial_agreement_types t
  where t.financial_agreement_code=a.financial_agreement_code;

alter table water.licence_agreements
  alter column financial_agreement_type_id set not null;

alter table water.licence_agreements
  drop column financial_agreement_code;

alter table water.licence_agreements
  add constraint uniq_licence_ref_start_date_financial_agreement_type_id unique("licence_ref", "start_date", "financial_agreement_type_id");


/* signed date is a date field and does not need to be a timestamp */
alter table water.licence_agreements
  alter column date_signed type date;
