/*
  https://eaflood.atlassian.net/browse/WATER-5659

  Our users identified an issue with our returns notice 'fallback' logic.

  When we send a returns invitation, if the email to the primary user fails, we automatically generate another notice to
  the licence holder's address. That part is working fine.

  When we then get confirmation from [GOV.UK Notify](https://www.notifications.service.gov.uk/) that the letter has been
  'received' (meaning successfully sent to their mail provider), not only do we update the notification status, but we
  should be setting the 'due date' on the associated return logs.

  It is this part that had the bug. We fixed it in [Fix not setting due date for alt. returns
  notices](https://github.com/DEFRA/water-abstraction-system/pull/3363).

  But there are now several return logs missing a due date. This migration sets the missing due date for the affected
  return logs.

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
    WITH notification_due_dates AS (
      SELECT
        logs.return_log_id::uuid,
        sn.due_date
      FROM
        water.scheduled_notification sn
      CROSS JOIN LATERAL
        jsonb_array_elements_text(sn.return_log_ids) AS logs(return_log_id)
      WHERE
        sn.message_ref = 'returns invitation alternate'
        AND sn.status = 'sent'
        AND sn.notify_status = 'received'
        AND sn.due_date IS NOT NULL
    )
    UPDATE "returns"."returns" r
    SET
      due_date = ndd.due_date
    FROM
      notification_due_dates ndd
    WHERE
      r.id = ndd.return_log_id
      AND r.due_date IS NULL;
  END IF;
END
$$;
