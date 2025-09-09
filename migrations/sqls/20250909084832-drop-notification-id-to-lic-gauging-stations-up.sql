/*
  https://eaflood.atlassian.net/browse/WATER-5232

  In [Add notification ID to licence gauging stations](https://github.com/DEFRA/water-abstraction-service/pull/2719), we
  added `notification_id` to `water.licence_gauging_stations`. This stemmed from us spotting that the last alert details
  in the monitoring station page do not align with the ones shown on the view licence monitoring stations page in some
  cases.

  Our initial thought was that if we add the ID of the notification, it'll make the job of finding the last notification
  much easier. We then realised that, as part of the change, we also need to go the other way, from the
  `water.scheduled_notification` to `water.licence_gauging_stations`, so we added `licence_gauging_station_id` to
  `water.scheduled_notification`.

  The change also included scripts to populate the fields for both records.

  We've come to start linking the models in
  [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system/pull/2374) only to realise linking both
  ways actually complicates things. The originating intent was to find the last sent notification for a licence
  monitoring station. In every other scenario we do this, we just query for the sub-records, order by date, and return
  the first one. This was the first time we tried to put the 'last sub-record' directly against the parent record.

  Adding the relationships was going to be more complex. We also realised we might be opening ourselves up to bugs. What
  if, for a licence monitoring station, I first sent a letter, then an email? Notify will provide me the status update
  for the email pretty quickly, so we'll flag that as the last alert. But a day later, when we check the letter's
  status, Notify has updated it to sent.

  In this case, we'll update the licence monitoring station to say the letter was the last alert sent, when in fact it
  was the email. This is because we update the LMS when a status change is seen, irrespective of what notification we
  got the status for.

  So, in this change, we are going to drop the `notification_id` column from `water.licence_gauging_stations`.
*/
ALTER TABLE IF EXISTS water.licence_gauging_stations DROP COLUMN notification_id;
