exports.upsert = `insert into water.billing_invoice_licences (
  billing_invoice_id, licence_ref, date_created, date_updated, licence_id
) values (:billingInvoiceId, :licenceRef, NOW(), NOW(), :licenceId) on conflict (billing_invoice_id, licence_id) do update set date_updated = NOW() returning *;`

exports.deleteEmptyByBatchId = `delete from water.billing_invoice_licences l
  where l.billing_invoice_licence_id in (
  select l.billing_invoice_licence_id
  from water.billing_batches b
  join water.billing_invoices i on b.billing_batch_id=i.billing_batch_id
  join water.billing_invoice_licences l on i.billing_invoice_id=l.billing_invoice_id
  left join water.billing_transactions t on l.billing_invoice_licence_id=t.billing_invoice_licence_id
  where b.billing_batch_id=:batchId
  group by l.billing_invoice_licence_id
  having count(t.billing_transaction_id)=0);`

exports.deleteByBatchId = `delete from water.billing_invoice_licences il
  using water.billing_invoices i where i.billing_invoice_id = il.billing_invoice_id
  and i.billing_batch_id = :batchId;`
