/* Replace with your SQL commands */
alter table water.billing_invoices
  drop column credit_note_value,
  drop column invoice_value,
  drop column is_de_minimis;

/* replace not null constraints */
alter table water.billing_transactions
  drop constraint charge_element_id_check,
  alter column charge_element_id set not null,
  drop constraint start_date_check,
  alter column start_date set not null,
  drop constraint end_date_check,
  alter column end_date set not null,
  drop constraint abstraction_period_check,
  alter column abstraction_period set not null,
  drop constraint source_check,
  alter column source set not null,
  drop constraint season_check,
  alter column season set not null,
  drop constraint loss_check,
  alter column loss set not null,
  drop constraint volume_check,
  alter column volume set not null;

alter table water.billing_transactions
  alter column charge_type type varchar;

drop type if exists water.charge_type;

create type water.charge_type 
  as enum('standard', 'compensation');

alter table water.billing_transactions
  alter column charge_type type water.charge_type using (charge_type::water.charge_type);
