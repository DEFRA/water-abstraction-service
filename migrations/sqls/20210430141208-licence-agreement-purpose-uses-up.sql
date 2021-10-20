/* Convert primary key to proper UUID column */
alter table water.licence_agreements
  alter column licence_agreement_id type uuid using licence_agreement_id::uuid;

/* Add a legacy ID column to track TPT agreements imported from NALD */
alter table water.licence_agreements
  add column external_id varchar default null unique;

/* Create a join table to allow purpose uses to be attached to a licence agreement */
create table water.licence_agreement_purpose_uses (
  licence_agreement_purpose_use_id uuid not null default gen_random_uuid() primary key,
  licence_agreement_id uuid not null references water.licence_agreements (licence_agreement_id),
  purpose_use_id uuid not null references water.purposes_uses (purpose_use_id),
  unique(licence_agreement_id, purpose_use_id)
);
