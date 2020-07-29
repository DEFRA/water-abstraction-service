'use strict';

exports.findByBatchIdForTwoPartTariffReview = `
select l.licence_ref, l.licence_id,     
    array_agg(v.two_part_tariff_status) as "two_part_tariff_statuses",
    array_agg(v.two_part_tariff_error) as "two_part_tariff_errors"
  from water.billing_batches b
  join water.billing_batch_charge_versions bcv on b.billing_batch_id=bcv.billing_batch_id
  join water.charge_versions cv on bcv.charge_version_id=cv.charge_version_id
  join water.licences l on cv.licence_ref=l.licence_ref
  join water.charge_elements e on bcv.charge_version_id=e.charge_version_id
  join water.billing_volumes v on v.billing_batch_id=b.billing_batch_id and e.charge_element_id=v.charge_element_id
  where b.billing_batch_id=:billingBatchId
  group by l.licence_id`;
