/* Replace with your SQL commands */

/* Create a join table to allow purpose uses to be attached to a licence agreement */
create table water.licence_agreement_purpose_uses (
  licence_agreement_purpose_use_id uuid not null default public.gen_random_uuid() primary key,
  licence_agreement_id uuid not null references water.licence_agreements (licence_agreement_id),
  purpose_use_id uuid not null references water.purposes_uses (purpose_use_id),
  unique(licence_agreement_id, purpose_use_id)
);

alter table water.charge_elements 
  drop column is_section_127_agreement_enabled;
