---------------
-- create types
---------------
create type water.charge_type as enum ('standard', 'compensation');
create type water.charge_batch_type as enum ('annual', 'supplementary', 'two_part_tariff');


---------------------------------------------------
-- update varchar to uuid type where uuids intended
---------------------------------------------------

-- drop the foreign key constraints
DO $$DECLARE r record;
BEGIN
  FOR r IN
    select n.nspname as schema_name,
      t.relname as table_name,
      c.conname as constraint_name
    from pg_constraint c
      join pg_class t on c.conrelid = t.oid
      join pg_namespace n on t.relnamespace = n.oid
    where t.relname in('charge_agreements', 'charge_elements')
    and n.nspname = 'water'
    and c.contype = 'f'
  LOOP
    EXECUTE 'ALTER TABLE water.' || quote_ident(r.table_name)|| ' DROP CONSTRAINT '|| quote_ident(r.constraint_name) || ';';
  END LOOP;
END$$;


-- update from varchar to uuid
alter table if exists water.charge_agreements
  alter column charge_agreement_id set data type uuid using charge_agreement_id::uuid,
  alter column charge_element_id set data type uuid using charge_element_id::uuid;

alter table if exists water.charge_versions
  alter column charge_version_id set data type uuid using charge_version_id::uuid;

alter table if exists water.charge_elements
  alter column charge_version_id set data type uuid using charge_version_id::uuid,
  alter column charge_element_id set data type uuid using charge_element_id::uuid;


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



------------------------
-- create the new tables
------------------------

create table water.billing_batches (
  billing_batch_id uuid primary key default gen_random_uuid(),
  region_id uuid not null
    constraint billing_batches_region_id_fkey
    references water.regions (region_id),
  batch_type water.charge_batch_type not null,
  financial_year integer not null,
  season water.charge_element_season not null,
  date_created timestamp not null default now(),
  date_updated timestamp not null default now()
);

create table water.billing_batch_charge_versions (
  billing_batch_charge_version_id uuid primary key default gen_random_uuid(),
  billing_batch_id uuid not null
    constraint billing_batch_charge_versions_billing_batch_id_fkey
    references water.billing_batches (billing_batch_id),
  charge_version_id uuid not null
    constraint billing_batch_charge_versions_charge_version_id_fkey
    references water.charge_versions (charge_version_id),
  date_created timestamp not null default now(),
  date_updated timestamp not null default now()
);

create table water.billing_invoices (
  billing_invoice_id uuid primary key default gen_random_uuid(),
  invoice_account_id uuid not null,
  address jsonb not null,
  invoice_account_number text,
  net_amount decimal,
  is_credit boolean,
  date_created timestamp not null default now(),
  date_updated timestamp not null default now()
);

create table water.billing_batch_invoices (
  billing_batch_invoice_id uuid primary key default gen_random_uuid(),
  billing_batch_id uuid not null
    constraint billing_batch_invoices_billing_batch_id_fkey
    references water.billing_batches (billing_batch_id),
  billing_invoice_id uuid not null
    constraint billing_batch_invoices_billing_invoice_id_fkey
    references water.billing_invoices (billing_invoice_id),
  date_created timestamp not null default now(),
  date_updated timestamp not null default now()
);

create table water.billing_invoice_licences (
  billing_invoice_licence_id uuid primary key default gen_random_uuid(),
  billing_invoice_id uuid not null
    constraint billing_invoice_licences_billing_invoice_id_fkey
    references water.billing_invoices (billing_invoice_id),
  company_id uuid not null,
  contact_id uuid not null,
  address_id uuid not null,
  licence_ref varchar not null,
  licence_holder_name jsonb not null,
  licence_holder_address jsonb not null,
  date_created timestamp not null default now(),
  date_updated timestamp not null default now()
);

create table water.billing_transactions (
  billing_transaction_id uuid primary key default gen_random_uuid(),
  billing_invoice_licence_id uuid not null
    constraint billing_transactions_billing_invoice_licence_id_fkey
    references water.billing_invoice_licences (billing_invoice_licence_id),
  charge_element_id uuid not null
    constraint billing_transactions_charge_element_id_fkey
    references water.charge_elements (charge_element_id),
  licence_ref varchar not null,
  start_date timestamp not null,
  end_date timestamp not null,
  abstraction_period jsonb not null,
  source water.charge_element_source not null,
  source_value decimal,
  season water.charge_element_season not null,
  season_value decimal,
  loss water.charge_element_loss not null,
  loss_value decimal,
  net_amount decimal,
  is_credit boolean,
  charge_type water.charge_type,
  authorised_quantity decimal,
  billable_quantity decimal,
  authorised_days decimal,
  billable_days decimal,
  status text,
  description text,
  date_created timestamp not null default now(),
  date_updated timestamp not null default now()
);
