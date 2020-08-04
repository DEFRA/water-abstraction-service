/**
 * Updates the include_in_supplementary_billing value in the
 * water licences table from a value to a value for a given batch
 */
const updateIncludeInSupplementaryBillingStatusForBatch = `
  update water.licences l
  set include_in_supplementary_billing = :to
  from
    water.billing_batches b
      join water.billing_batch_charge_versions bcv
        on b.billing_batch_id = bcv.billing_batch_id
      join water.charge_versions cv
        on bcv.charge_version_id = cv.charge_version_id
  where l.licence_ref = cv.licence_ref
  and b.billing_batch_id = :batchId
  and b.batch_type = 'supplementary'
  and l.include_in_supplementary_billing = :from;
`;

exports.updateIncludeInSupplementaryBillingStatusForBatch = updateIncludeInSupplementaryBillingStatusForBatch;
