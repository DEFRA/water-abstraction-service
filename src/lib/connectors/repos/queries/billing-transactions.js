exports.findHistoryByBatchId = `
select t.* from water.billing_transactions t
join water.billing_invoice_licences il on t.billing_invoice_licence_id=il.billing_invoice_licence_id
join water.billing_invoices i on il.billing_invoice_id=i.billing_invoice_id
join water.billing_batches b on i.billing_batch_id=b.billing_batch_id
join (
  select il.licence_id,
    make_date(b.from_financial_year_ending-1, 4, 1) AS min_date,
    make_date(b.to_financial_year_ending, 3, 31) AS max_date
  from water.billing_batches b
  join water.billing_invoices i on b.billing_batch_id=i.billing_batch_id
  join water.billing_invoice_licences il on i.billing_invoice_id=il.billing_invoice_id
  where b.billing_batch_id=:batchId
) il_2 on il.licence_id=il_2.licence_id
where
  b.status='sent'
  and b.billing_batch_id<>:batchId
  and b.batch_type<>'two_part_tariff'
  and t.start_date>=il_2.min_date
  and t.end_date<=il_2.max_date
order by t.date_created ASC
`;

exports.findByBatchId = `
select t.* from water.billing_transactions t
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
