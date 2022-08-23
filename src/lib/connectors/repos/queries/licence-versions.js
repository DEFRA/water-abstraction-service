'use strict'

exports.getNewLicenceVersionsForChargeVersionWorkflow = `SELECT DISTINCT
lvs.licence_version_id,
lvs.licence_id
FROM (
  SELECT lv.licence_version_id,
    lv.licence_id
  FROM water.licence_versions lv
  WHERE lv.date_created >= :dateAndTime
  UNION
  SELECT lv.licence_version_id,
    lv.licence_id
  FROM water.licences l
    INNER JOIN water.licence_versions lv ON l.licence_id = lv.licence_id
    AND lv.status IN ('superseded', 'current')
    LEFT JOIN water.charge_versions cv ON l.licence_ref = cv.licence_ref
  WHERE cv.licence_ref IS NULL
) AS lvs
LEFT JOIN water.charge_version_workflows cvw ON cvw.licence_version_id = lvs.licence_version_id
LEFT JOIN (
  SELECT licence_id
  FROM water.charge_versions cv
    INNER JOIN water.billing_batch_charge_version_years bbcvy ON bbcvy.charge_version_id = cv.charge_version_id
    INNER JOIN water.billing_batches bb ON bb.billing_batch_id = bbcvy.billing_batch_id
  WHERE bb.status IN ('review', 'ready')
) sub_cv ON sub_cv.licence_id = lvs.licence_id
WHERE cvw.licence_version_id IS NULL
AND sub_cv.licence_id IS NULL;`
