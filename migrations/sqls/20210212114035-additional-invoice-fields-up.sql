/* Replace with your SQL commands */
alter table water.billing_invoices
  add column credit_note_value numeric,
  add column invoice_value numeric,
  add column is_de_minimis boolean not null default false;

alter table water.billing_transactions
  alter column charge_type type varchar;

drop type if exists water.charge_type;

create type water.charge_type 
  as enum('standard', 'compensation', 'minimum_charge');

alter table water.billing_transactions
  alter column charge_type type water.charge_type using (charge_type::water.charge_type),
  alter column charge_element_id drop not null,
  add constraint charge_element_id_check check (
    charge_type='minimum_charge' or charge_element_id is not null
  ),
  alter column start_date drop not null,
  add constraint start_date_check check (
    charge_type='minimum_charge' or start_date is not null
  ),
  alter column end_date drop not null,
  add constraint end_date_check check (
    charge_type='minimum_charge' or end_date is not null
  ),
  alter column abstraction_period drop not null,
  add constraint abstraction_period_check check (
    charge_type='minimum_charge' or abstraction_period is not null
  ),
  alter column source drop not null,
  add constraint source_check check (
    charge_type='minimum_charge' or source is not null
  ),
  alter column season drop not null,
  add constraint season_check check (
    charge_type='minimum_charge' or season is not null
  ),
  alter column loss drop not null,
  add constraint loss_check check (
    charge_type='minimum_charge' or loss is not null
  ),
  alter column volume drop not null,
  add constraint volume_check check (
    charge_type='minimum_charge' or volume is not null
  );
