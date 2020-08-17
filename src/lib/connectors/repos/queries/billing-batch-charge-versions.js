'use strict';

exports.deleteByBatchIdAndLicenceId = `
delete from water.billing_batch_charge_versions bcv
  using water.charge_versions cv, water.licences l
  where bcv.billing_batch_id=:billingBatchId
    and bcv.charge_version_id=cv.charge_version_id
    and cv.licence_ref=l.licence_ref
    and l.licence_id=:licenceId
`;

exports.create = `
insert into water.billing_batch_charge_versions 
  (billing_batch_id, charge_version_id, date_created, date_updated)
  values (:billingBatchId, :chargeVersionId, NOW(), NOW())
  on conflict (billing_batch_id, charge_version_id)
    do nothing
  returning *
`;