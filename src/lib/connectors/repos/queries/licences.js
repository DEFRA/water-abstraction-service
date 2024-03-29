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
 * Updates the `include_in_sroc_supplementary_billing` flag for licences marked for SROC supplementary billing
 *
 * When a supplementary bill run gets approved (sent in the Charging Module) the legacy service updates the flag
 * on all licences that were marked for processing. It needs to do it by date because you can have licences flagged
 * that don't end up in the bill run, and with no other mechanism for knowing they were looked at this is what you
 * are left with.
 *
 * In water-abstraction-system we have ensured those which don't make it to the bill run are handled at the end of the
 * bill run creation process. This means we can run a query which unflags only those licences connected to the bill
 * run.
 *
 * This avoids situations where, for example, the NALD import runs and updates the licence record causing it's
 * date_updated to be later than the bill runs date_created (the basis for the legacy query).
 */
const updateIncludeInSrocSupplementaryBillingStatusForBatch = `
  UPDATE water.licences l
  SET include_in_sroc_supplementary_billing = FALSE
  FROM water.billing_invoice_licences bil
  INNER JOIN water.billing_invoices bi ON bi.billing_invoice_id = bil.billing_invoice_id
  WHERE l.licence_id = bil.licence_id
    AND bi.billing_batch_id = :batchId
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
exports.updateIncludeInSrocSupplementaryBillingStatusForBatch = updateIncludeInSrocSupplementaryBillingStatusForBatch
exports.updateIncludeInSupplementaryBillingStatusForBatch = updateIncludeInSupplementaryBillingStatusForBatch
exports.findByBatchIdForTwoPartTariffReview = findByBatchIdForTwoPartTariffReview
exports.getLicencesByInvoiceAccount = getLicencesByInvoiceAccount
