exports.deleteChargeElements = `DELETE FROM water.charge_elements where charge_version_id IN 
  (select charge_version_id FROM water.charge_versions WHERE licence_ref IN 
    (select licence_ref from water.licences WHERE is_test = true));`;

exports.deleteChargeVersions = `DELETE FROM water.charge_versions WHERE licence_ref IN 
    (select licence_ref from water.licences WHERE is_test = true);`;

exports.deleteChargeVerionWorkflows = `DELETE from water.charge_version_workflows`;
