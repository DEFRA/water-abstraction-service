alter type water.rebilling_state
 rename to rebilling_state_old;

create type water.rebilling_state as enum('rebill', 'reversal', 'rebilled', 'unrebillable');

alter table water.billing_invoices
  alter column rebilling_state type water.rebilling_state using rebilling_state::text::water.rebilling_state;

drop type water.rebilling_state_old;

UPDATE water.billing_invoices bi set rebilling_state = 'unrebillable' WHERE bi.legacy_id is not null;
