const findLicenceVersionPurposeConditionsByLicenceId = `
  SELECT lvpc.licence_version_purpose_condition_id, lvpc.param_1, lvpc.param_2, lvpc.notes
  FROM water.licence_version_purpose_conditions lvpc 
  JOIN water.licence_version_purposes lvp on lvp.licence_version_purpose_id = lvpc.licence_version_purpose_id
  JOIN water.licence_versions lv on lv.licence_version_id = lvp.licence_version_id
  JOIN water.licences l on lv.licence_id = l.licence_id
  WHERE l.licence_id = :licenceId;`;

exports.findLicenceVersionPurposeConditionsByLicenceId = findLicenceVersionPurposeConditionsByLicenceId;
