alter table water.billing_invoices
  add column if not exists invoice_number varchar;