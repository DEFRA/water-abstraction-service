exports.upsert = `
insert into water.billing_invoice_licences (
  billing_invoice_id, company_id, contact_id, address_id, licence_ref, licence_holder_name,
  licence_holder_address, date_created, date_updated, licence_id
)
values (
  :billingInvoiceId, :companyId, :contactId, :addressId, :licenceRef, :licenceHolderName,
  :licenceHolderAddress, NOW(), NOW(), :licenceId
)
on conflict (billing_invoice_id, company_id, address_id, licence_id) do update
  set date_updated = NOW()
returning *
`;

exports.deleteEmptyByBatchId = `
delete from water.billing_invoice_licences l
  where l.billing_invoice_licence_id in (
    select l.billing_invoice_licence_id
      from water.billing_batches b
      join water.billing_invoices i on b.billing_batch_id=i.billing_batch_id
      join water.billing_invoice_licences l on i.billing_invoice_id=l.billing_invoice_id
      left join water.billing_transactions t on l.billing_invoice_licence_id=t.billing_invoice_licence_id
      where b.billing_batch_id=:batchId
      group by l.billing_invoice_licence_id
      having count(t.billing_transaction_id)=0
  )
`;

exports.findLicencesWithTransactionStatusesForBatch = `
  select
    bil.billing_invoice_id,
    bil.billing_invoice_licence_id,
    bil.licence_id,
    bil.licence_ref,
    bil.licence_holder_name,
    array_agg(bv.two_part_tariff_status) as "two_part_tariff_statuses",
    array_agg(bv.two_part_tariff_error) as "two_part_tariff_errors" 
  from water.billing_invoices bi
    join water.billing_invoice_licences bil
      on bi.billing_invoice_id = bil.billing_invoice_id
    join water.billing_transactions bt
      on bt.billing_invoice_licence_id = bil.billing_invoice_licence_id
    join water.billing_volumes bv
      on bv.charge_element_id = bt.charge_element_id
  where bi.billing_batch_id = :batchId
  group by
    bil.billing_invoice_id,
    bil.billing_invoice_licence_id,
    bil.licence_ref,
    bil.licence_holder_name;
`;

exports.deleteByBatchId = `
  delete from water.billing_invoice_licences il
  using water.billing_invoices i
  where i.billing_invoice_id = il.billing_invoice_id
  and i.billing_batch_id = :batchId;
`;
