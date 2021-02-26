/**
 * @todo this query needs checking to ensure it will locate past transactions
 * where there is no charge in the current batch - for example where a non
 * chargeable charge version has been created that covers the full financial year
 */
exports.findHistoryByBatchId = `
select t.*
from water.billing_batches b 
join water.licences l on b.region_id=l.region_id and l.include_in_supplementary_billing='yes'
join (
  select t.*, il.licence_id, il.licence_ref, i.invoice_account_number, i.invoice_account_id, i.financial_year_ending, 
  b.billing_batch_id, b.is_summer
  from water.billing_transactions t
  join water.billing_invoice_licences il on t.billing_invoice_licence_id=il.billing_invoice_licence_id
  join water.billing_invoices i on il.billing_invoice_id=i.billing_invoice_id
  join water.billing_batches b on i.billing_batch_id=b.billing_batch_id
  where 
    b.billing_batch_id<>:batchId
    and b.status='sent'
    and i.is_de_minimis=false
) t on t.licence_id=l.licence_id and t.financial_year_ending>= b.from_financial_year_ending and t.financial_year_ending<=b.to_financial_year_ending
where b.billing_batch_id=:batchId
order by t.date_created asc
`;

exports.findByBatchId = `
select t.*, il.licence_id, il.licence_ref, i.invoice_account_number, i.financial_year_ending, i.invoice_account_id, 
i.invoice_account_number, b.billing_batch_id, b.is_summer
from water.billing_transactions t
join water.billing_invoice_licences il on t.billing_invoice_licence_id=il.billing_invoice_licence_id
join water.billing_invoices i on il.billing_invoice_id=i.billing_invoice_id
join water.billing_batches b on i.billing_batch_id=b.billing_batch_id
where b.billing_batch_id=:batchId;
`;

exports.findStatusCountsByBatchId = `
select t.status, count(t.status)
  from water.billing_batches b
  join water.billing_invoices i on b.billing_batch_id=i.billing_batch_id
  join water.billing_invoice_licences il on i.billing_invoice_id=il.billing_invoice_id
  join water.billing_transactions t on t.billing_invoice_licence_id=il.billing_invoice_licence_id
  where b.billing_batch_id=:batchId
  group by t.status;
`;

exports.deleteByBatchId = `
  delete
  from water.billing_transactions tx
  using water.billing_invoice_licences il, water.billing_invoices i
  where il.billing_invoice_licence_id = tx.billing_invoice_licence_id
  and i.billing_invoice_id = il.billing_invoice_id
  and i.billing_batch_id = :batchId;
`;

exports.deleteByInvoiceId = `
delete from water.billing_transactions t
  using water.billing_invoice_licences l
  where 
    t.billing_invoice_licence_id=l.billing_invoice_licence_id 
    and l.billing_invoice_id=:billingInvoiceId
`;

exports.countByBatchId = `
  select count(t.billing_transaction_id) 
    from water.billing_transactions t
    join water.billing_invoice_licences il on t.billing_invoice_licence_id=il.billing_invoice_licence_id
    join water.billing_invoices i on il.billing_invoice_id=i.billing_invoice_id
    where i.billing_batch_id=:billingBatchId
`;
