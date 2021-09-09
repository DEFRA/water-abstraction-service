/* Replace with your SQL commands */
create type water.rebilling_state as enum('rebill', 'reversal');

alter table water.billing_invoices 
  add column original_billing_invoice_id uuid default null,
  add column rebilling_state water.rebilling_state default null,
  add constraint fk_original_billing_invoice_id 
  foreign key (original_billing_invoice_id) 
  references water.billing_invoices (billing_invoice_id);
