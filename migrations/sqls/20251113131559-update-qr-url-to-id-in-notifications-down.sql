/*
  Revert back to return_id

  Note - We have to wrap the query in an anonymous code block because we depend on a table in another schema but when
  this is run in CI that schema does not exist.
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
        table_schema = 'returns'
        AND table_name = 'returns'
    )
  THEN
    WITH subquery AS (
      SELECT
        r.return_id AS return_id,
        sn.id AS notification_id
      FROM
        water.scheduled_notification sn
      INNER JOIN "returns"."returns" r ON
        r.id::text = sn.personalisation->>'qr_url'
      WHERE
      sn.personalisation->>'qr_url' IS NOT NULL
    )
    UPDATE water.scheduled_notification sn
    SET
      personalisation = jsonb_set(sn.personalisation,'{qr_url}', to_jsonb((subquery.return_id)), true)
    FROM
      subquery
    WHERE
      sn.id = subquery.notification_id;
  END IF;
END
$$;
