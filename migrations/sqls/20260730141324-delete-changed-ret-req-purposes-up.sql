/*
  https://eaflood.atlassian.net/browse/WATER-5760

  The business spotted a return requirement purpose in an RDP report they did not believe should exist.

  We tracked it down to the fact they had amended the return requirement purpose in NALD. This caused the legacy import to believe it was a 'new' return requirement purpose and it was imported into the service.

  That import was switched off last year when we took over returns from NALD.

  But the RDP reports are based on our data so we need to clean this up.

  This migration deletes return requirement purposes that were imported from NALD, but now no longer exist. In testing
  we found examples where B&D have deleted _all_ the purposes for a return requirement, or the whole return requirement
  itself. We cannot leave a return requirement with no purposes, so we ignore any where the deletion would leave the
  return requirement with no purposes.

  > The 'whole requirement' deletions would have happened after the import was switched off. They shouldn't be doing
  > _anything_ with returns data in NALD anymore!
*/

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
        AND table_name = 'NALD_RET_FMT_PURPOSES'
    )
  THEN
    WITH parsed_ids AS (
      SELECT
        split_part(rrp.external_id, ':', 1) AS region_code,
        split_part(rrp.external_id, ':', 2) AS format_id,
        split_part(rrp.external_id, ':', 3) AS primary_purpose_code,
        split_part(rrp.external_id, ':', 4) AS secondary_purpose_code,
        split_part(rrp.external_id, ':', 5) AS purpose_code,
        rrp.*
      FROM
        water.return_requirement_purposes rrp
      WHERE
        rrp.external_id IS NOT NULL
    ),
    to_be_deleted_candidates AS (
      SELECT
        pi.*
      FROM
        parsed_ids pi
      WHERE
        NOT EXISTS (
          SELECT
            1
          FROM
            "import"."NALD_RET_FMT_PURPOSES" nrfp
          WHERE
            nrfp."FGAC_REGION_CODE" = pi.region_code
            AND nrfp."ARTY_ID" = pi.format_id
            AND nrfp."APUR_APPR_CODE" = pi.primary_purpose_code
            AND nrfp."APUR_APSE_CODE" = pi.secondary_purpose_code
            AND nrfp."APUR_APUS_CODE" = pi.purpose_code
        )
    ),
    validated_deletions AS (
      -- Only keep candidates if they leave behind at least one valid purpose
      SELECT
        tbdc.*
      FROM
        to_be_deleted_candidates tbdc
      WHERE
        EXISTS (
          SELECT
            1
          FROM
            water.return_requirement_purposes rrp_keep
          WHERE
            rrp_keep.return_requirement_id = tbdc.return_requirement_id
            -- Ensure this surviving record is NOT slated for deletion
            AND rrp_keep.return_requirement_purpose_id NOT IN (
              SELECT
                return_requirement_purpose_id
              FROM
                to_be_deleted_candidates
            )
        )
    )
    DELETE FROM
      water.return_requirement_purposes rrp
    WHERE
      rrp.return_requirement_purpose_id IN (
        SELECT
          vd.return_requirement_purpose_id
        FROM
          validated_deletions vd
      );
  END IF;
END
$$;
