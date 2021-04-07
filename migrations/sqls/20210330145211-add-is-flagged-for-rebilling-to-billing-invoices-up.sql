alter table water.billing_invoices
  add column is_flagged_for_rebilling boolean not null default false;