/*
  https://eaflood.atlassian.net/browse/WATER-5039
*/

DO $$
BEGIN
  IF EXISTS
    (
      SELECT
        1
      FROM
        water.licences l
      WHERE
        l.licence_ref = 'SW/050/008/034'
        AND EXISTS (
          SELECT
            1
          FROM
            water.charge_versions cv
          WHERE
            cv.licence_ref = 'SW/050/008/034'
        )
    )
  THEN
    DELETE FROM water.charge_version_workflows cvw WHERE cvw.licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = 'SW/050/008/034');

    UPDATE water.charge_versions cv SET "status" = 'superseded' WHERE cv.licence_ref = 'SW/050/008/034' AND cv.version_number = 1;

    INSERT INTO water.charge_versions
    SELECT
      gen_random_uuid() AS charge_version_id,
      'SW/050/008/034' AS licence_ref,
      'sroc' AS scheme,
      NULL AS external_id,
      2 AS version_number,
      '2023-08-15' AS start_date,
      'current' AS status,
      NULL AS apportionment,
      FALSE AS error,
      NULL AS end_date,
      NULL AS billed_upto_date,
      5 AS region_code,
      NOW() AS date_created,
      NOW() AS date_updated,
      'wrls' AS "source",
      FALSE AS is_test,
      NULL AS company_id,
      NULL AS invoice_account_id,
      (SELECT cr.change_reason_id FROM water.change_reasons cr WHERE cr.description LIKE 'Shell licence%') AS change_reason_id,
      '{"id": 79, "email": "rachel.hughes01@environment-agency.gov.uk"}'::jsonb AS created_by,
      '{"id": 79, "email": "rachel.hughes01@environment-agency.gov.uk"}'::jsonb AS approved_by,
      (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = 'SW/050/008/034') AS licence_id,
      NULL AS note_id;

    UPDATE water.licences l SET include_in_sroc_supplementary_billing = TRUE WHERE l.licence_ref = 'SW/050/008/034';
  END IF;
END
$$;
