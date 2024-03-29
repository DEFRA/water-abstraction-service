/* Replace with your SQL commands */
alter type water.rebilling_state
 rename to rebilling_state_old;

create type water.rebilling_state as enum('rebill', 'reversal');

update water.billing_invoices set rebilling_state = 'rebill' where original_billing_invoice_id is not null and rebilling_state = 'rebilled';
update water.billing_invoices set rebilling_state = null where original_billing_invoice_id is null and rebilling_state = 'rebilled';

alter table water.billing_invoices
  alter column rebilling_state type water.rebilling_state using rebilling_state::text::water.rebilling_state;

drop type water.rebilling_state_old;