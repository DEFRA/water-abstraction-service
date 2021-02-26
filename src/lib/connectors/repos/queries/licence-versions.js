exports.findIdsCreatedAfterDate = `
SELECT licence_version_id, licence_id
FROM (
SELECT * FROM
water.licence_versions
WHERE date_created >=:dateAndTime
UNION
select lv.*
from water.licences l
  inner join water.licence_versions lv
    on l.licence_id = lv.licence_id and lv.status in ('superseded', 'current')
  left join water.charge_versions cv
    on l.licence_ref = cv.licence_ref
where cv.licence_ref is null) AS licenceVersions
WHERE licence_version_id NOT IN (
SELECT licence_version_id
FROM water.charge_version_workflows);`;
