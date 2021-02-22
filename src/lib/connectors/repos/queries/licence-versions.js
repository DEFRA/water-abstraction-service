exports.findIdsCreatedAfterDate = `SELECT licence_version_id, licence_id
FROM water.licence_versions
WHERE date_created >=:dateAndTime 
AND licence_version_id NOT IN (
SELECT licence_version_id
FROM water.charge_version_workflows);`;
