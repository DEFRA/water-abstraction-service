/* Replace with your SQL commands */
/* Replace with your SQL commands */
alter table water.billing_invoices
  drop column credit_note_value,
  drop column invoice_value,
  drop column is_de_minimis;

alter table water.billing_transactions
  alter column charge_type type varchar;

drop type if exists water.charge_type;

create type water.charge_type 
  as enum('standard', 'compensation');

alter table water.billing_transactions
  alter column charge_type type water.charge_type using (charge_type::water.charge_type);
