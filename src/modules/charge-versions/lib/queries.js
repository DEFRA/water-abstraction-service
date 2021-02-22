const { pool } = require('../../../lib/connectors/db');

exports.getNewLicenceVersions = async (dateTime) => {
  console.log(dateTime);
  const query = `SELECT licence_version_id
  FROM water.licence_versions
  WHERE date_created >= $1 
  EXCEPT 
  SELECT licence_version_id
  FROM water.charge_version_workflows`;

  const { rows } = await pool.query(query, dateTime);
  return rows;
};
