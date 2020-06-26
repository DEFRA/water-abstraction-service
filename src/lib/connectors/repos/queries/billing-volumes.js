exports.deleteByInvoiceLicenceAndBatchId = `
  delete
  from water.billing_volumes bv
    using water.billing_transactions tx
  where bv.charge_element_id = tx.charge_element_id
    and tx.billing_invoice_licence_id = :invoiceLicenceId
    and bv.billing_batch_id = :batchId;
`;

exports.deleteByBatchAndInvoiceId = `
  delete
  from water.billing_volumes v
    using water.billing_transactions t, water.billing_invoice_licences l
  where v.charge_element_id=t.charge_element_id
    and t.billing_invoice_licence_id=l.billing_invoice_licence_id
    and v.isApproved=false
    and v.billing_batch_id=:batchId
    and l.billing_invoice_id=:billingInvoiceId;
    `;
