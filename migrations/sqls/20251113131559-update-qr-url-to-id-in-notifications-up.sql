/*
  https://eaflood.atlassian.net/browse/WATER-5353

  In [Use new return log id](https://github.com/DEFRA/water-abstraction-system/pull/2561), we updated the
  **-water-abstraction-system** app, the primary app for WRLS now, to start using the return log ID for links and when
  referencing in code.

  When we took over the project, `returns.returns` was a table where a unique UUID had been rejected in favour of a
  self-determined ID, for example, `v1:9:99/999:10039999:2025-04-01:2026-03-31`.

  The problem for us is that it forced us to make an exception for return log routes. An ID like that is invalid for
  passing as a path param, so we were forced to set links using a query param, for
  example,`/system/return-logs?id=v1:9:99/999:10039999:2025-04-01:2026-03-31`.

  Even then, for many, it still looks wrong in a URL.

  As part of taking over returns management from NALD, we added an `id` column to all existing and new return logs that
  is a proper UUID. This meant we could update return logs to follow the conventions used in the rest of the service.

  Part of the change was that when creating a new notification for a paper return, we switched from populating the
  `qr_url` property in the notification's `personalisation` JSONB field from the old ID to the new one.

  The view notification page uses this to link to the return log when viewing a paper return. To keep this working and
  ensure the data is consistent, we also need to update all existing paper returns to use the new ID for the `qr_url`
  property.

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
        r.id AS return_log_id,
        sn.id AS notification_id
      FROM
        water.scheduled_notification sn
      INNER JOIN "returns"."returns" r ON
        r.return_id = sn.personalisation->>'qr_url'
      WHERE
      sn.personalisation->>'qr_url' IS NOT NULL
    )
    UPDATE water.scheduled_notification sn
    SET
      personalisation = jsonb_set(sn.personalisation,'{qr_url}', to_jsonb(subquery.return_log_id), true)
    FROM
      subquery
    WHERE
      sn.id = subquery.notification_id;
  END IF;
END
$$;
