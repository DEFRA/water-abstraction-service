/*
  The Notify template ids where not previously stored.

  This migration adds the column to record the Notify template id.

  https://docs.notifications.service.gov.uk/node.html#templateid-required
*/

ALTER TABLE water.scheduled_notification ADD COLUMN template_id UUID DEFAULT NULL;
