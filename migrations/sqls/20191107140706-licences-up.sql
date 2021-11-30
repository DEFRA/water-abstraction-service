SELECT '§§§§§§§§2';
SELECT * FROM information_schema.columns WHERE table_schema = 'water' AND table_name = 'licences';

alter table water.billing_invoice_licences
  add column if not exists licence_id uuid not null
    constraint billing_invoice_transactions_licence_id_fkey
    references water.licences (licence_id);
