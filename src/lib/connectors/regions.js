const { pool } = require('./db');

const getRegionsQuery = `
  select
    region_id,
    charge_region_id,
    nald_region_id,
    name,
    date_created,
    date_updated
  from water.regions;
`;

const getRegions = () => pool.query(getRegionsQuery);

exports.getRegions = getRegions;
