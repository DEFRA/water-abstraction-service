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
    and v.is_approved=false
    and v.billing_batch_id=:batchId
    and l.billing_invoice_id=:billingInvoiceId;
    `;

exports.findByBatchIdAndLicenceId = `
select v.*, cv.invoice_account_id
  from water.billing_volumes v
  join water.charge_elements ce on v.charge_element_id=ce.charge_element_id
  join water.charge_versions cv on ce.charge_version_id=cv.charge_version_id
  join water.licences l on cv.licence_ref=l.licence_ref
  where v.billing_batch_id=:billingBatchId
  and l.licence_id=:licenceId
`;

exports.deleteByBatchIdAndLicenceId = `
delete from water.billing_volumes v
  using water.charge_elements ce, water.charge_versions cv, water.licences l
  where v.charge_element_id=ce.charge_element_id
    and ce.charge_version_id=cv.charge_version_id
    and cv.licence_ref=l.licence_ref
    and l.licence_id=:licenceId
    and v.billing_batch_id=:billingBatchId
`;

exports.findByChargeVersionFinancialYearAndSeason = `
select bv.* from water.charge_elements ce
join water.billing_volumes bv on 
  ce.charge_element_id=bv.charge_element_id 
  and bv.financial_year=:financialYearEnding 
  and bv.is_summer=:isSummer 
where ce.charge_version_id=:chargeVersionId`;

exports.findByChargeVersionAndFinancialYear = `
select bv.*, bb.source 
from water.billing_volumes bv
join water.charge_elements ce on bv.charge_element_id=ce.charge_element_id
join water.billing_batches bb on bv.billing_batch_id=bb.billing_batch_id
and ce.charge_version_id=:chargeVersionId
and bv.financial_year=:financialYearEnding
and bv.is_approved=true 
and bv.errored_on is null
`;

exports.deleteByFinancialYearEnding = `
 DELETE FROM water.billing_volumes bv
 USING water.charge_versions cv JOIN
 water.charge_elements ce ON cv.charge_version_id = ce.charge_version_id 
 WHERE ce.charge_element_id = bv.charge_element_id 
 and cv.licence_id =:licenceId 
 and bv.financial_year =:financialYearEnding
 and bv.billing_batch_id =:batchId;
`;
