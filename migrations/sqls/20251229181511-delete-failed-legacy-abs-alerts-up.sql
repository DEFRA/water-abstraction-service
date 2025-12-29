/*
  https://eaflood.atlassian.net/browse/WATER-5395

  We had an issue where some notices were not displaying the overall status on the Notices page. They all seemed to be
  connected to a single issuer, but we couldn't see anything specifically different about their setup. When we created
  the same user locally, all worked as expected.

  We initially thought it was something in the legacy code because fields we no longer touch were being set and updated
  by it. So, our first stab at resolving the problem was to [Stop interfering with notices &
  notifications](https://github.com/DEFRA/water-abstraction-service/pull/2745).

  This was shipped, but it actually made things worse! Previously, they might not have had an overall status on the
  page, but they were at least sent. After the release, they were no longer being sent. But we had also made a series of
  other changes to notifications, and what `message_ref` we set. We made [changes to the
  table](https://github.com/DEFRA/water-abstraction-service/pull/2751) to support this.

  This helped us spot what was really going on. Notifications created by this issuer were using the old message refs. We
  were able to confirm that they were working from a list of old links to the legacy version of the view monitoring
  stations page. This meant they were still using the legacy journey to create their abstraction alerts.

  We've since moved the user across to the new page and journey, and they have resent the alerts that didn't send after
  the [11 December 2025 release](https://github.com/DEFRA/water-abstraction-service/releases/tag/v3.17.0).

  The final thing left to do is delete the failed legacy abstraction alert notifications they created.
*/

-- Step 1 - Delete any legacy water abstraction notifications
DELETE FROM water.scheduled_notification sn
WHERE sn.message_ref ILIKE 'water_abstraction_alert%';

-- Step 2 - Delete the notices that now have no notifications linked to them
DELETE FROM water.events e
WHERE
  e."type" = 'notification'
  AND NOT EXISTS (
    SELECT 1 FROM water.scheduled_notification sn WHERE sn.event_id = e.event_id
  );
