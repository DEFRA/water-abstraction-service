/* Replace with your SQL commands */
alter table water.billing_invoices
  drop column original_billing_invoice_id,
  drop column rebilling_state;

drop type water.rebilling_state;
