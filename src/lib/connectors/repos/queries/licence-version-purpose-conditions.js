exports.findLicenceVersionPurposeConditionsByLicenceId = `
  SELECT * FROM (SELECT distinct on (lvpc.param_1, lvpc.param_2, lvpc.notes) lvpc.licence_version_purpose_condition_id, lvpc.param_1, lvpc.param_2, lvpc.notes, lvpc.date_created
  FROM water.licence_version_purpose_conditions lvpc
  JOIN water.licence_version_purposes lvp on lvp.licence_version_purpose_id = lvpc.licence_version_purpose_id
  JOIN water.licence_versions lv on lv.licence_version_id = lvp.licence_version_id
  JOIN water.licences l on lv.licence_id = l.licence_id
  WHERE lv.licence_id = :licenceId) AS temp ORDER BY date_created;`;

exports.findLicenceVersionPurposeConditionsByLicenceIdWithSpecificCode = `
  SELECT * FROM (SELECT distinct on (lvpc.param_1, lvpc.param_2, lvpc.notes) lvpc.licence_version_purpose_condition_id, lvpc.param_1, lvpc.param_2, lvpc.notes, lvpc.date_created
  FROM water.licence_version_purpose_conditions lvpc
  JOIN water.licence_version_purpose_condition_types lvpct on lvpc.licence_version_purpose_condition_type_id = lvpct.licence_version_purpose_condition_type_id
  JOIN water.licence_version_purposes lvp on lvp.licence_version_purpose_id = lvpc.licence_version_purpose_id
  JOIN water.licence_versions lv on lv.licence_version_id = lvp.licence_version_id
  JOIN water.licences l on lv.licence_id = l.licence_id
  WHERE lv.licence_id = :licenceId
  AND lvpct.code = :code) AS temp ORDER BY date_created;`;

exports.getLicenceVersionConditionByPartialExternalId = `
  SELECT lvpc.licence_version_purpose_condition_id, lvpc.licence_version_purpose_id
  FROM water.licence_version_purpose_conditions lvpc
  WHERE lvpc.external_id LIKE :partialExternalId
  ORDER BY lvpc.date_created desc;`;

exports.getLicenceVersionConditionType = `
  SELECT lvpc.licence_version_purpose_condition_type_id 
  FROM water.licence_version_purpose_conditions lvpc
  WHERE lvpc.licence_version_purpose_condition_id = :id 
`;

exports.upsertByExternalId = `
  INSERT INTO water.licence_version_purpose_conditions 
  (external_id, licence_version_purpose_id, licence_version_purpose_condition_type_id, notes, source)
  VALUES (:externalId, :licenceVersionPurposeId, :licenceVersionPurposeConditionTypeId, :notes, :source)
  ON CONFLICT (external_id) DO UPDATE SET 
  notes=:notes,
  licence_version_purpose_id=:licenceVersionPurposeId, 
  licence_version_purpose_condition_type_id=:licenceVersionPurposeConditionTypeId, 
  source=:source
`;
