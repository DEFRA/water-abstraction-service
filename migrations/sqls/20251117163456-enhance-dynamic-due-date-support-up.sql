/*
  https://eaflood.atlassian.net/browse/WATER-5230 https://eaflood.atlassian.net/browse/WATER-5218

  As part of the 'dynamic due dates' functionality we're implementing, we want to trigger an automatic 'letter' to be
  sent in the event the email fails to send.

  An email can fail due to an error that occurred when making the request to Notify, such as a network issue or a
  validation problem. Or, having reached Notify, they fail to send it because the email address is unknown, or a
  technical issue on the customer's end.

  At this time, we'll only trigger an automatic letter when a returns invitation to the primary user (email) fails to
  send. This is because there could be ramifications if return logs are _not_ submitted by the due date specified, but
  only if we can evidence that a notification was sent.

  To support this, we need to know which failed notifications need a letter and which have already been processed.

  Rather than just a boolean flag, we will record the ID of the alternate notice, as this will enable us to
  automatically link the failed notification to the notice that was triggered.

  We initially thought we could link notification-to-notification, hence we created a column called
  [alternate_notification_id](https://github.com/DEFRA/water-abstraction-service/pull/2737). But that was found to be
  too complex for a 'nice to have'. So, we switched it to
  [alternate_notice_id](https://github.com/DEFRA/water-abstraction-service/issues/2740). This change drops the old
  column.

  This change also makes some other changes related to this functionality.

  - New column `water.scheduled_notification.due_date`
  - New column `water.events.trigger_notice_id`

  **Due date**

  When we send a returns invitation, we specify the 'due date' in the notification. For dynamic due dates, when we
  receive confirmation from Notify that the notification has been 'sent', we will apply the due date to the linked
  return logs.

  Currently, that date is stored in the JSONB field `personalisation` as text, for example, `28 November 2025`. We're
  getting a little fed up with building functionality on random properties in JSONB fields, so in this migration, we
  also add a `due_date` column. We run a one-off script to populate it for existing records.

  **Trigger notice ID**

  The automatically triggered notice, for all intents and purposes, is the same as one sent manually. That way, we can
  reuse nearly all the existing functionality we have for creating and sending notices.

  However, it would be helpful to know which notices were triggered automatically, and which notice triggered them.
  Adding a `trigger_notice_id` column, which is populated with the ID of the notice linked to the failed notifications,
  will tell us both.
*/

-- 1. Drop the column we created initially but have since replace with alternate_notice_id
ALTER TABLE water.scheduled_notification DROP COLUMN alternate_notification_id;

-- 2. Add new due_date column
ALTER TABLE water.scheduled_notification ADD COLUMN due_date date DEFAULT NULL;

-- 3. Populate due_date for existing notifications that have it held in personalisation
WITH subquery AS (
  SELECT
    sn.id,
    (to_date(sn.personalisation->>'returnDueDate', 'DD Month YYYY')) AS due_date
  FROM
    water.scheduled_notification sn
  WHERE
    sn.personalisation->>'returnDueDate' IS NOT NULL
)
UPDATE water.scheduled_notification sn
SET
  due_date = subquery.due_date
FROM
  subquery
WHERE
  sn.id = subquery.id;

-- 4. Add new trigger_notice_id column to events
ALTER TABLE water.events ADD COLUMN trigger_notice_id uuid DEFAULT NULL;
