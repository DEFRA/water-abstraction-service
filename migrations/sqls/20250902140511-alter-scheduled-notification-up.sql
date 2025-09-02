/*
  https://eaflood.atlassian.net/browse/WATER-5229

  The legacy code always populates the `send_after` field with the current time when creating a notification, and only
  sometimes the `date_created` field.

  The new code in [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system) always populates
  `date_created`, and never populates `send_after`. We now consider it a redundant field.

  Our issue is that our acceptance tests rely on an endpoint that returns the last notification created for a specified
  email address. But the disparity between how the two systems create notifications means it can no longer find the last
  email, which has broken some of the tests.

  We need to fix it so it can!

  This change runs a migration that does two things.

  - updates the table so that `date_created` will now automatically populate when a new record is inserted
  - update existing records setting `date_created` to `send_after` where `date_created` is null and `send_after` isn't

  In the legacy code, when it creates a notification without setting `date_created`, `send_after` is set to the current
  date and time. So, it is a de facto 'date created'.
*/

ALTER TABLE IF EXISTS water.scheduled_notification ALTER COLUMN date_created SET DEFAULT now();

UPDATE water.scheduled_notification SET date_created = send_after WHERE date_created IS NULL AND send_after IS NOT NULL;
