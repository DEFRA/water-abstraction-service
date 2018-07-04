const { pool } = require('../../../lib/connectors/db');

/**
 * Perform a database query by getting a client from the connection pool and releasing
 * If an error is thrown, the client is still released and the error rethrown
 * @param {String} query - SQL query
 * @param {Array} params - bound SQL query params
 * @return {Promise} resolves with query data
 */
const dbQuery = async (query, params = []) => {
  const client = await pool.connect();
  try {
    const res = await client.query(query, params);
    client.release();
    return res.rows;
  } catch (error) {
    console.error(error);
    client.release();
    throw error;
  }
};

const getMain = async (licenceNo) => {
  const query = `
    select * from import.
    -- "NALD_ABSTAT_WFD_DATA"
    "NALD_ABS_LICENCES"
    where "LIC_NO"=$1
    `;
  const params = [licenceNo];
  return dbQuery(query, params);
};
const getCams = async (code, FGAC_REGION_CODE) => {
  const query = `
    select * from import."NALD_REP_UNITS"
    where "CODE"=$1 and "FGAC_REGION_CODE" = $2
    `;
  const params = [code, FGAC_REGION_CODE];
  return dbQuery(query, params);
};
const getCurrentVersion = async (licenceId, FGAC_REGION_CODE) => {
  const query = `
    SELECT
      v.*, t.*
    FROM
      import."NALD_ABS_LIC_VERSIONS" v
      JOIN import."NALD_WA_LIC_TYPES" t ON v."WA_ALTY_CODE" = t."CODE"
      JOIN import."NALD_ABS_LICENCES" l ON v."AABL_ID" = l."ID" AND l."FGAC_REGION_CODE"=v."FGAC_REGION_CODE"
    WHERE
      "AABL_ID" = $1
      AND v."FGAC_REGION_CODE" = $2
      AND (
      0 = 0
      AND "EFF_END_DATE" = 'null'
      OR to_date( "EFF_END_DATE", 'DD/MM/YYYY' ) > now()
      )
      AND ( 0 = 0 -- and "EFF_ST_DATE" = 'null'--  OR to_date( "EFF_ST_DATE", 'DD/MM/YYYY' ) <= now()
      )
      AND v."STATUS" = 'CURR'
      AND (l."EXPIRY_DATE" = 'null' OR to_date(l."EXPIRY_DATE", 'DD/MM/YYYY') > NOW())
      AND (l."LAPSED_DATE" = 'null' OR to_date(l."LAPSED_DATE", 'DD/MM/YYYY') > NOW())
      AND (l."REV_DATE" = 'null' OR to_date(l."REV_DATE", 'DD/MM/YYYY') > NOW())
    ORDER BY
      "ISSUE_NO" DESC,
      "INCR_NO" DESC
      LIMIT 1
    `;
  const params = [licenceId, FGAC_REGION_CODE];

  const rows = await dbQuery(query, params);

  return rows.length ? rows[0] : null;
};
const getVersions = async (licenceId, FGAC_REGION_CODE) => {
  const query = `
    select * from import."NALD_ABS_LIC_VERSIONS"
--     JOIN NALD_WA_LIC_TYPES ON "NALD_ABS_LIC_VERSIONS"."WA_ALTY_CODE"="NALD_WA_LIC_TYPES"."CODE"
    where "AABL_ID"=$1 and "FGAC_REGION_CODE" = $2
    `;
  const params = [licenceId, FGAC_REGION_CODE];

  return dbQuery(query, params);
};
const getParties = async (ID, FGAC_REGION_CODE) => {
  const query = `
    select
    p.*
    from
    import."NALD_PARTIES" p
    where p."ID"=$1 and "FGAC_REGION_CODE" = $2
  `;
  const params = [ID, FGAC_REGION_CODE];
  return dbQuery(query, params);
};
const getPartyContacts = async (APAR_ID, FGAC_REGION_CODE) => {
  const query = `
    select
    c.*,
    row_to_json(a.*) AS party_address
    from
    import."NALD_CONTACTS" c
    left join import."NALD_ADDRESSES" a
    on a."ID"=c."AADD_ID"
    where c."APAR_ID"=$1 and c."FGAC_REGION_CODE" = $2 and a."FGAC_REGION_CODE" = $2
  `;
  const params = [APAR_ID, FGAC_REGION_CODE];
  return dbQuery(query, params);
};
const getParty = async (APAR_ID, FGAC_REGION_CODE) => {
  const query = `
    select p.* from
    import."NALD_PARTIES" p
    where "ID"=$1 and "FGAC_REGION_CODE" = $2
  `;
  const params = [APAR_ID, FGAC_REGION_CODE];
  return dbQuery(query, params);
};
const getAddress = async (AADD_ID, FGAC_REGION_CODE) => {
  const query = `
    select
    a.*
    from import."NALD_ADDRESSES" a
    where "ID"=$1 and "FGAC_REGION_CODE" = $2
  `;
  const params = [AADD_ID, FGAC_REGION_CODE];
  return dbQuery(query, params);
};
const getRoles = async (AABL_ID, FGAC_REGION_CODE) => {
  const query = `
    select row_to_json(r.*) AS role_detail,
          row_to_json(t.*) AS role_type,
          row_to_json(p.*) AS role_party,
          row_to_json(a.*) AS role_address,

          ARRAY(
          select
          row_to_json(x.*) AS contact_data from (
            SELECT
            *
            from import."NALD_CONT_NOS" c
            left join import."NALD_CONT_NO_TYPES" ct on c."ACNT_CODE"=ct."CODE"
            where r."ACON_APAR_ID"=c."ACON_APAR_ID" and r."ACON_AADD_ID" = c."ACON_AADD_ID"
            and c."FGAC_REGION_CODE" = $2

          ) x
          )

          from
          import."NALD_LIC_ROLES" r
          left join import."NALD_LIC_ROLE_TYPES" t on r."ALRT_CODE"=t."CODE"
          left join import."NALD_PARTIES" p on r."ACON_APAR_ID"=p."ID"
          left join import."NALD_ADDRESSES" a on r."ACON_AADD_ID"=a."ID"



          where

      r."AABL_ID"=$1
      and r."FGAC_REGION_CODE" = $2
      and p."FGAC_REGION_CODE" = $2
      and a."FGAC_REGION_CODE" = $2
      AND (r."EFF_END_DATE" = 'null'
      OR to_date( r."EFF_END_DATE", 'DD/MM/YYYY' ) > now()
      )
  `;

  const params = [AABL_ID, FGAC_REGION_CODE];
  return dbQuery(query, params);
};
const getPurposes = async (licenceId, FGAC_REGION_CODE, ISSUE_NO, INCR_NO) => {
  let query, params;
  if (ISSUE_NO && INCR_NO) {
    query = `
        select
              *
        from
        import."NALD_ABS_LIC_PURPOSES" p
        where p."AABV_AABL_ID"=$1 and "FGAC_REGION_CODE" = $2 and "AABV_ISSUE_NO"=$3  and "AABV_INCR_NO" = $4
    `;
    params = [licenceId, FGAC_REGION_CODE, ISSUE_NO, INCR_NO];
  } else {
    query = `
        select
              *
        from
        import."NALD_ABS_LIC_PURPOSES" p
        where p."AABV_AABL_ID"=$1 and "FGAC_REGION_CODE" = $2
        `;
    params = [licenceId, FGAC_REGION_CODE];
  }
  return dbQuery(query, params);
};
const getPurposePoints = async (purposeId, FGAC_REGION_CODE) => {
  const query = `
        select
              pp.*,
              row_to_json(m.*) AS means_of_abstraction,
              row_to_json(p.*) AS point_detail,
              row_to_json(s.*) AS point_source
              from
              import."NALD_ABS_PURP_POINTS" pp
              left join import."NALD_MEANS_OF_ABS" m on m."CODE"=pp."AMOA_CODE"
              left join import."NALD_POINTS" p on p."ID"=pp."AAIP_ID"
              left join import."NALD_SOURCES" s on s."CODE"=p."ASRC_CODE"
        where pp."AABP_ID"=$1 and pp."FGAC_REGION_CODE" = $2 and p."FGAC_REGION_CODE" = $2
    `;
  const params = [purposeId, FGAC_REGION_CODE];
  return dbQuery(query, params);
};
const getPurpose = async (purpose) => {
  const query = `
      select
            row_to_json(p1.*) AS purpose_primary,
            row_to_json(p2.*) AS purpose_secondary,
            row_to_json(p3.*) AS purpose_tertiary
      from
      import."NALD_PURP_PRIMS" p1
      left join import."NALD_PURP_SECS" p2 on p2."CODE"=$2
      left join import."NALD_PURP_USES" p3 on p3."CODE"=$3
      where p1."CODE"=$1
  `;
  const params = [purpose.primary, purpose.secondary, purpose.tertiary];
  return dbQuery(query, params);
};
const getPurposePointLicenceAgreements = async (AABP_ID, FGAC_REGION_CODE) => {
  const query = `
      select * from import."NALD_LIC_AGRMNTS"
      where "AABP_ID"=$1 and "FGAC_REGION_CODE" = $2
  `;
  const params = [AABP_ID, FGAC_REGION_CODE];
  return dbQuery(query, params);
};
const getPurposePointLicenceConditions = async (AABP_ID, FGAC_REGION_CODE) => {
  const query = `
    select c.*,
    row_to_json(ct.*) AS condition_type
    from import."NALD_LIC_CONDITIONS" c
    left join import."NALD_LIC_COND_TYPES" ct on ct."CODE"=c."ACIN_CODE" and ct."SUBCODE"=c."ACIN_SUBCODE"
    where "AABP_ID"=$1 and c."FGAC_REGION_CODE" = $2
    order by "DISP_ORD" asc
`;
  const params = [AABP_ID, FGAC_REGION_CODE];
  return dbQuery(query, params);
};

/**
 * Gets a list of all the licences for import
 * @return {Promise} resolves with array of data from import table
 */
const getImportLicences = async () => {
  const sql = `SELECT "LIC_NO", "REV_DATE", "LAPSED_DATE" FROM "import"."NALD_ABS_LICENCES"`;
  return dbQuery(sql);
};

module.exports = {
  getMain,
  getCams,
  getCurrentVersion,
  getVersions,
  getParties,
  getPartyContacts,
  getParty,
  getAddress,
  getRoles,
  getPurposes,
  getPurposePoints,
  getPurpose,
  getPurposePointLicenceAgreements,
  getPurposePointLicenceConditions,
  getImportLicences
};
