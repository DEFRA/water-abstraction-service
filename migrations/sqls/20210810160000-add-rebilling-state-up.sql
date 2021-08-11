alter type water.rebilling_state
 rename to rebilling_state_old;

create type water.rebilling_state as enum('rebill', 'reversal', 'rebilled');

alter table water.billing_invoices
  alter column rebilling_state type water.rebilling_state using rebilling_state::text::water.rebilling_state;

drop type water.rebilling_state_old;