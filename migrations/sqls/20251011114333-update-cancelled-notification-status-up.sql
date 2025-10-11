/*
  Update status of cancelled Notifications to `cancelled`

  https://eaflood.atlassian.net/browse/WATER-5328

  While working on [Updating view notification to support all
  statuses](https://github.com/DEFRA/water-abstraction-system/pull/2507) (not just `SENT` ones), we came across a subset
  of almost 3,000 notifications.

  These have a status of `SENT` but a Notify status of `cancelled`. This situation only applies to letters because
  Notify does not send them to the provider until the evening. This means users can cancel any letter via the Notify
  dashboard before it is sent.

  At the moment, we are displaying these as `SENT`, which is not correct.

  We're making a change to the [notification-status job](https://github.com/DEFRA/water-abstraction-system) to
  automatically set the status of cancelled notifications to `CANCELLED`. But we need to do the same for the existing
  notifications.

  > We checked in `prod` before writing the migration. All cancelled notifications had a WRLS status of 'sent' prior to
  > this script being run.
*/

UPDATE water.scheduled_notification SET status = 'cancelled' WHERE notify_status = 'cancelled';
