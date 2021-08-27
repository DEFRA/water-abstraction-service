/* Replace with your SQL commands */
alter type water.rebilling_state
 rename to rebilling_state_old;

create type water.rebilling_state as enum('rebill', 'reversal', 'rebilled');

update water.billing_invoices set rebilling_state = null where rebilling_state = 'unrebillable';

alter table water.billing_invoices
  alter column rebilling_state type water.rebilling_state using rebilling_state::text::water.rebilling_state;

drop type water.rebilling_state_old;
