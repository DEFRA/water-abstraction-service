/* Replace with your SQL commands */
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
    -- We don't re-add the workflow record, as that can more easily be recreated in the UI

    UPDATE water.licences l SET include_in_sroc_supplementary_billing = FALSE WHERE l.licence_ref = 'SW/050/008/034';

    DELETE FROM water.charge_versions cv WHERE cv.licence_ref = 'SW/050/008/034' AND cv.version_number = 2;

    UPDATE water.charge_versions cv SET "status" = 'current' WHERE cv.licence_ref = 'SW/050/008/034' AND cv.version_number = 1;
  END IF;
END
$$;
