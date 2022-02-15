
exports.getNewLicenceVersionsForChargeVersionWorkflow = `select
distinct licenceVersions.licence_version_id,
  licenceVersions.licence_id
from
(select * from water.licence_versions where
date_created >= :dateAndTime
union
select lv.* from water.licences l
inner join water.licence_versions lv on
l.licence_id = lv.licence_id
and lv.status in ('superseded', 'current')
left join water.charge_versions cv on
l.licence_ref = cv.licence_ref where
cv.licence_ref is null) as licenceVersions where
licence_version_id not in (select
licence_version_id from water.charge_version_workflows where 
licence_version_id is not null)
and licence_id not in (select licence_id from water.charge_versions cv 
join water.billing_batch_charge_version_years bbcvy on cv.charge_version_id = bbcvy.charge_version_id 
join water.billing_batches bb on bb.billing_batch_id = bbcvy.billing_batch_id 
where bb.status in ('review', 'ready'));`;
