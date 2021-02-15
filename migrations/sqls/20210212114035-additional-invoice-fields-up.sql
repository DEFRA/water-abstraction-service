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
  alter column charge_type type water.charge_type using (charge_type::water.charge_type);
