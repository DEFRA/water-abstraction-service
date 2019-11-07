drop table if exists water.billing_transactions;
drop table if exists water.billing_invoice_licences;
drop table if exists water.billing_batch_invoices;
drop table if exists water.billing_invoices;
drop table if exists water.billing_batch_charge_versions;
drop table if exists water.billing_batches;

drop type if exists water.charge_type;
drop type if exists water.charge_batch_type;



------------------------------
-- update uuid to varchar type
------------------------------

-- drop the foreign key constraints
alter table if exists water.charge_agreements
  drop constraint charge_agreements_charge_element_id_fkey;

alter table if exists water.charge_elements
  drop constraint charge_elements_charge_version_id_fkey;


alter table if exists water.charge_agreements
  alter column charge_agreement_id set data type varchar using charge_agreement_id::varchar,
  alter column charge_element_id set data type varchar using charge_element_id::varchar;

alter table if exists water.charge_versions
  alter column charge_version_id set data type varchar using charge_version_id::varchar;

alter table if exists water.charge_elements
  alter column charge_version_id set data type varchar using charge_version_id::varchar,
  alter column charge_element_id set data type varchar using charge_element_id::varchar;


-- reinstate the foreign key relationships
alter table if exists water.charge_agreements
  add constraint charge_agreements_charge_element_id_fkey
    foreign key (charge_element_id)
    references water.charge_elements (charge_element_id)
    match simple
    on delete cascade;

alter table if exists water.charge_elements
  add constraint charge_elements_charge_version_id_fkey
    foreign key (charge_version_id)
    references water.charge_versions (charge_version_id)
    match simple
    on delete cascade;


