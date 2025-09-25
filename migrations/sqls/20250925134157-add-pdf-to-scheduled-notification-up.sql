/*
  The Return forms where not previously stored.

  This migration adds the column to record the Return forms.

  Notify states a 'precompiled letter must be a PDF file'

  https://docs.notifications.service.gov.uk/node.html#send-a-precompiled-letter
*/

ALTER TABLE water.scheduled_notification ADD COLUMN pdf BYTEA DEFAULT NULL;
