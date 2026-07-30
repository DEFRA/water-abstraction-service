/*
  https://eaflood.atlassian.net/browse/WATER-5760

  The business spotted a return requirement purpose in an RDP report they did not believe should exist.

  We tracked it down to the fact they had amended the return requirement purpose in NALD. This caused the legacy import to believe it was a 'new' return requirement purpose and it was imported into the service.

  That import was switched off last year when we took over returns from NALD.

  But the RDP reports are based on our data so we need to clean this up.

  This migration deletes return requirement purposes that were imported from NALD, but now no longer exist.
*/

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
to_be_deleted_records AS (
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
)
DELETE FROM
  water.return_requirement_purposes rrp
WHERE
  rrp.return_requirement_purpose_id IN (
    SELECT
      tbdr.return_requirement_purpose_id
    FROM
      to_be_deleted_records tbdr
  );
