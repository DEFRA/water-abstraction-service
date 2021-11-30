alter table water.billing_invoice_licences
  add column licence_id uuid not null
    constraint billing_invoice_transactions_licence_id_fkey
    references water.licences (licence_id);
