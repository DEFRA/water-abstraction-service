exports.findLicenceVersionPurposeConditionsByLicenceId = `
  SELECT lvpc.licence_version_purpose_condition_id as licenceVersionPurposeConditionId, lvpc.param_1 as param1, lvpc.param_2 as param2, lvpc.notes
  FROM water.licence_version_purpose_conditions lvpc 
  JOIN water.licence_version_purposes lvp on lvp.licence_version_purpose_id = lvpc.licence_version_purpose_id
  JOIN water.licence_versions lv on lv.licence_version_id = lvp.licence_version_id
  JOIN water.licences l on lv.licence_id = l.licence_id
  WHERE l.licence_id = :licenceId;`;

exports.findLicenceVersionPurposeConditionsByLicenceIdWithSpecificCode = `
  SELECT lvpc.licence_version_purpose_condition_id as licenceVersionPurposeConditionId, lvpc.param_1 as param1, lvpc.param_2 as param2, lvpc.notes
  FROM water.licence_version_purpose_conditions lvpc 
  JOIN water.licence_version_purpose_condition_types lvpct on lvpc.licence_version_purpose_condition_type_id = lvpct.licence_version_purpose_condition_type_id
  JOIN water.licence_version_purposes lvp on lvp.licence_version_purpose_id = lvpc.licence_version_purpose_id
  JOIN water.licence_versions lv on lv.licence_version_id = lvp.licence_version_id
  JOIN water.licences l on lv.licence_id = l.licence_id
  WHERE l.licence_id = :licenceId
  AND lvpct.code = :code;`;
