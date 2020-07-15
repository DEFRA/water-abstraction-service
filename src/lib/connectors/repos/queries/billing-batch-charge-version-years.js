exports.findStatusCountsByBatchId = `
select status, count(*) 
  from water.billing_batch_charge_version_years y
  where billing_batch_id = :batchId
  group by status
`;

exports.deleteByInvoiceId = `
delete from water.billing_batch_charge_version_years y
  using 
    water.billing_invoices i, 
    water.billing_invoice_licences l,
    water.billing_transactions t,
    water.charge_elements e
  where i.billing_invoice_id=:billingInvoiceId 
    and i.billing_invoice_id=l.billing_invoice_id 
    and t.billing_invoice_licence_id=l.billing_invoice_licence_id 
    and t.charge_element_id=e.charge_element_id 
    and y.charge_version_id=e.charge_version_id
    and y.financial_year_ending=i.financial_year_ending
`;
