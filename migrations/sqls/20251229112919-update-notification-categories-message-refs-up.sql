/*
  https://eaflood.atlassian.net/browse/WATER-5436

  To support dynamic due dates on return logs, we have had to make several changes to how return notice notifications
  are created and handled.

  This is because a return log's 'due date' depends on whether we have successfully sent a returns invitation for it.

  A number of the factors that determine what we do, such as contact type, were previously combined with notice and
  method type in a single field: `message_ref`.

  In [Record contact and notice type in notifications](https://github.com/DEFRA/water-abstraction-service/pull/2751), we
  updated the `water.schedule_notification` table and our sending notices logic to split this information into its own
  columns.

  We knew of `water.schedule_notification_categories`, but also knew that nothing in the legacy service used it, nor was
  it 'properly' linked to `water.scheduled_notification`. You could get the same information from looking at the linked
  `water.events` table (the notice record). So, we didn't concern ourselves with updating anything in it. In fact, we
  were going to drop the table altogether!

  After the [change was shipped](https://github.com/DEFRA/water-abstraction-service/releases/tag/v3.17.0), we were
  contacted by the RDP team. It turns out they were using the table to categorise notifications by notice type. If we'd
  have known, we'd have advised looking in `water.events` for the notice type, but also our changes to `message_ref`
  mean there is no need to categorise notifications anymore.

  However, it will take some effort to update their views and, therefore, the subsequent reports. So, in the meantime,
  they have asked if there is anything we can do to get the existing reports working.

  So, this migration updates `scheduled_notification_refs` in `water.schedule_notification_categories` to reflect the
  new message refs we're setting.
*/
UPDATE water.scheduled_notification_categories snc
SET scheduled_notification_refs = '{paper return}'
WHERE snc.category_value='returns_paper_forms';

UPDATE water.scheduled_notification_categories snc
SET scheduled_notification_refs = '{returns reminder}'
WHERE snc.category_value='returns.reminders';

UPDATE water.scheduled_notification_categories snc
SET scheduled_notification_refs = '{returns invitation}'
WHERE snc.category_value='returns.invitations';

UPDATE water.scheduled_notification_categories snc
SET scheduled_notification_refs = '{abstraction alert resume}'
WHERE snc.category_value='waa.resume';

UPDATE water.scheduled_notification_categories snc
SET scheduled_notification_refs = '{abstraction alert stop}'
WHERE snc.category_value='waa.stop';

UPDATE water.scheduled_notification_categories snc
SET scheduled_notification_refs = '{abstraction alert reduce,abstraction alert reduce or stop}'
WHERE snc.category_value='waa.reduce';

UPDATE water.scheduled_notification_categories snc
SET scheduled_notification_refs = '{abstraction alert reduce warning,abstraction alert stop warning,abstraction alert reduce or stop warning}'
WHERE snc.category_value='waa.warning';
