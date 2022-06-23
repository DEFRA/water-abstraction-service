'use strict'

const findByBatchIdForTwoPartTariffReview = `
  select l.licence_ref, l.licence_id,
    array_agg(v.two_part_tariff_status) as "two_part_tariff_statuses",
    array_agg(v.two_part_tariff_error) as "two_part_tariff_errors",
    cv.invoice_account_id,
    sum(case when v.calculated_volume <> v.volume then 1 else 0 end)::integer AS return_volume_edited
  from water.billing_batches b
  join water.billing_batch_charge_version_years y on b.billing_batch_id=y.billing_batch_id
  join water.charge_versions cv on y.charge_version_id=cv.charge_version_id
  join water.licences l on cv.licence_ref=l.licence_ref
  join water.charge_elements e on y.charge_version_id=e.charge_version_id
  join water.billing_volumes v on v.billing_batch_id=b.billing_batch_id and e.charge_element_id=v.charge_element_id
  where b.billing_batch_id=:billingBatchId
  group by l.licence_id, invoice_account_id`

/**
 * Updates the include_in_supplementary_billing value in the water licences table from a value to a value
 * when the licence updated date is less than or equal to the batch created date
 * and the licence is in the specified region
 * and the licence is not in the charge version workflow table with a null deleted date.
 */
const updateIncludeInSupplementaryBillingStatusForBatchCreatedDate = `
  update water.licences l
  set include_in_supplementary_billing = :to
  where l.date_updated <= :batchCreatedDate
    and l.region_id = :regionId
    and l.licence_id not in (select licence_id from water.charge_version_workflows where date_deleted is null)
    and l.include_in_supplementary_billing = :from
`

/**
 * Updates the include_in_supplementary_billing value in the
 * water licences table from a value to a value for a given batch
 */
const updateIncludeInSupplementaryBillingStatusForBatch = `
  update water.licences l
  set include_in_supplementary_billing = :to
  from
    water.billing_batches b
      join water.billing_batch_charge_version_years y
        on b.billing_batch_id = y.billing_batch_id
      join water.charge_versions cv
        on y.charge_version_id = cv.charge_version_id      
  where l.licence_ref = cv.licence_ref
  and b.billing_batch_id = :batchId
  and b.batch_type = 'supplementary'
  and l.include_in_supplementary_billing = :from
  and l.licence_id in (
    select il.licence_id
    from 
      water.billing_invoice_licences il 
        join water.billing_invoices i
          on il.billing_invoice_id = i.billing_invoice_id 
    where i.billing_batch_id = :batchId
    ); 
`

const getLicencesByInvoiceAccount = `
select distinct l.* from water.charge_versions cv
join water.licences l on cv.licence_id=l.licence_id
where cv.invoice_account_id=:invoiceAccountId
and cv.status='current'
`

exports.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate = updateIncludeInSupplementaryBillingStatusForBatchCreatedDate
exports.updateIncludeInSupplementaryBillingStatusForBatch = updateIncludeInSupplementaryBillingStatusForBatch
exports.findByBatchIdForTwoPartTariffReview = findByBatchIdForTwoPartTariffReview
exports.getLicencesByInvoiceAccount = getLicencesByInvoiceAccount
