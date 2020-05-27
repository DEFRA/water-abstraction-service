/* create new columns */
alter table water.billing_transactions 
  add column is_two_part_tariff_supplementary boolean;

/* set flag based on whether transactions were part of a TPT batch */
update water.billing_transactions 
  set is_two_part_tariff_supplementary=subquery.is_two_part_tariff_supplementary
  from (
    select t.billing_transaction_id, b.batch_type='two_part_tariff' as is_two_part_tariff_supplementary from water.billing_transactions t
    join water.billing_invoice_licences l on t.billing_invoice_licence_id=l.billing_invoice_licence_id
    join water.billing_invoices i on l.billing_invoice_id=i.billing_invoice_id
    join water.billing_batches b on b.billing_batch_id=i.billing_batch_id
  ) as subquery
  where water.billing_transactions.billing_transaction_id=subquery.billing_transaction_id;

alter table water.billing_transactions 
  alter column is_two_part_tariff_supplementary SET NOT NULL;