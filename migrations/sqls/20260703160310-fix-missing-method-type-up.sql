/*
  https://eaflood.atlassian.net/browse/WATER-5723

  We've recently updated the view user pages and they now include the ability to view a users communications.

  After going live, our QA team found a user where clicking their communications caused an error page to be shown. After
  investigation, we found that this was due to a notification in the database that had no message type.

  We've checked, and these seem to be the very early (2018) notifications sent to users, when there may have been a bug
  or a design decision that meant the `message_type` was not set.

  [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system) assumes this field is always populated,
  hence is erroring when trying to process these records.

  Fortunately, we can determine what the `message_type` should be from the other details. This migration fixes these
  records.
*/
BEGIN;

UPDATE water.scheduled_notification sn
SET
  message_type = 'letter',
  updated_at = NOW()
WHERE
  sn.message_type IS NULL
  AND sn.recipient = 'n/a';

UPDATE water.scheduled_notification sn
SET
  message_type = 'email',
  updated_at = NOW()
WHERE
  sn.message_type IS NULL
  AND sn.recipient LIKE '%@%';

COMMIT;
