exports.deleteByInvoiceLicenceAndBatchId = `
  delete
  from water.billing_volumes bv
    using water.billing_transactions tx
  where bv.charge_element_id = tx.charge_element_id
    and tx.billing_invoice_licence_id = :invoiceLicenceId
    and bv.billing_batch_id = :batchId;
`;

exports.deleteByBatchAndInvoiceAccountId = `
  delete
  from water.billing_volumes bv
    using water.billing_transactions tx, water.billing_invoice_licences il, water.billing_invoices i
  where bv.charge_element_id = tx.charge_element_id
    and il.billing_invoice_licence_id = tx.billing_invoice_licence_id
    and i.billing_invoice_id = il.billing_invoice_id
    and i.billing_batch_id = :batchId
    and i.invoice_account_id = :invoiceAccountId;
    `;
