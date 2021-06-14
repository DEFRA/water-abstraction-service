exports.upsert = `insert into water.billing_invoices 
  (
    invoice_account_id, address, invoice_account_number, 
    date_created, date_updated, billing_batch_id, financial_year_ending,
    net_amount, invoice_number, credit_note_value, invoice_value, is_de_minimis, is_credit, external_id
  )
values (
    :invoiceAccountId, :address, :invoiceAccountNumber, 
    NOW(), NOW(), :billingBatchId, :financialYearEnding,
    :netAmount, :invoiceNumber, :creditNoteValue, :invoiceValue, :isDeMinimis, :isCredit, :externalId
)
on conflict (invoice_account_id, billing_batch_id, financial_year_ending) where legacy_id is null and rebilling_state is null do update 
  set date_updated = NOW(), 
    net_amount=EXCLUDED.net_amount, 
    credit_note_value=EXCLUDED.credit_note_value,
    invoice_value=EXCLUDED.invoice_value,
    invoice_number=EXCLUDED.invoice_number,
    is_de_minimis=EXCLUDED.is_de_minimis,
    is_credit=EXCLUDED.is_credit,
    external_id=EXCLUDED.external_id
  returning *;`;

exports.deleteEmptyByBatchId = `delete from water.billing_invoices i
  where i.billing_invoice_id in (
  select i.billing_invoice_id from water.billing_batches b 
  join water.billing_invoices i on b.billing_batch_id=i.billing_batch_id
  left join water.billing_invoice_licences l on i.billing_invoice_id=l.billing_invoice_id
  where b.billing_batch_id=:batchId
  group by i.billing_invoice_id
  having count(l.billing_invoice_licence_id)=0);`;

exports.findByIsFlaggedForRebillingAndRegion = `
select i.* from water.billing_invoices i
join water.billing_batches b on i.billing_batch_id=b.billing_batch_id
where i.is_flagged_for_rebilling=true
and b.region_id=:regionId;
`;

exports.resetIsFlaggedForRebilling = `
update water.billing_invoices t1
set is_flagged_for_rebilling=false
from water.billing_invoices t2
where 
  t2.billing_batch_id=:batchId 
  and t1.billing_batch_id<>t2.billing_batch_id 
  and t1.billing_invoice_id=t2.original_billing_invoice_id
  and t2.original_billing_invoice_id is not null
returning *;
`;
