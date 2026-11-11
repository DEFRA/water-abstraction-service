/*
  https://eaflood.atlassian.net/browse/WATER-5954

  The business has asked us to display Criticality. This is a field they can see in NALD but not in WRLS.

  This is information we don't currently have, so before we can do anything, we need to import the data from NALD.

  First step is to add two new fields to `water.licence_versions`. We'll be keeping these updated as part of
  [water-abstraction-import](https://github.com/DEFRA/water-abstraction-import), but as that runs during the night, to
  make this available on release day we also populate the fields as part of the data migration.
*/

ALTER TABLE water.licence_versions ADD COLUMN criticality_code TEXT;
ALTER TABLE water.licence_versions ADD COLUMN criticality_description TEXT;

DO $$
BEGIN
  IF EXISTS
    (
      SELECT
        1
      FROM
        information_schema.tables
      WHERE
        table_schema = 'import'
        AND table_name = 'NALD_ABS_LIC_VERSIONS'
    )
  THEN
    WITH
      nald_crit_data AS (
        SELECT
          concat_ws(':', nalv."FGAC_REGION_CODE", nalv."AABL_ID", nalv."ISSUE_NO", nalv."INCR_NO") AS external_id,
          ncc."CODE" AS nald_code,
          ncc."DESCR" AS nald_description
        FROM
          "import"."NALD_ABS_LIC_VERSIONS" nalv
        INNER JOIN
          "import"."NALD_CRIT_CLASSES" ncc
          ON ncc."CODE" = nalv."ACCL_CODE"
      )
      UPDATE water.licence_versions lv
      SET
        criticality_code = ncd.nald_code,
        criticality_description = ncd.nald_description,
        date_updated = NOW()
      FROM
        nald_crit_data ncd
      WHERE
        ncd.external_id = lv.external_id;
  END IF;
END
$$;
