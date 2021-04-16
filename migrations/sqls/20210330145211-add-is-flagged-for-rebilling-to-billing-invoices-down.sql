alter table water.billing_invoices
  drop column if exists is_flagged_for_rebilling;