exports.upsert = `insert into water.billing_invoices 
  (invoice_account_id, address, invoice_account_number, date_created, date_updated, billing_batch_id, financial_year_ending)
values (:invoiceAccountId, :address, :invoiceAccountNumber, NOW(), NOW(), :billingBatchId, :financialYearEnding)
on conflict (invoice_account_id, billing_batch_id, financial_year_ending, legacy_id) do update 
  set date_updated = NOW() returning *;`;

exports.deleteEmptyByBatchId = `delete from water.billing_invoices i
  where i.billing_invoice_id in (
  select i.billing_invoice_id from water.billing_batches b 
  join water.billing_invoices i on b.billing_batch_id=i.billing_batch_id
  left join water.billing_invoice_licences l on i.billing_invoice_id=l.billing_invoice_id
  where b.billing_batch_id=:batchId
  group by i.billing_invoice_id
  having count(l.billing_invoice_licence_id)=0);`;
