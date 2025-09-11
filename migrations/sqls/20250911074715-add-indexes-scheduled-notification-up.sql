/*
  https://eaflood.atlassian.net/browse/WATER-5244

  An issue has been spotted with the view notices page.

  When viewing the Notices, the status shown is either `SENT` or `ERROR`. However, if you click on a recently created
  notice, the status against each notification will be `PENDING`.

  This is confusing users.

  It's simply because the logic behind the view notices page is too simplistic. It is only checking if a notice has an
  error flag. If it does, it is showing `ERROR`, else `SENT`.

  We need to amend the query that is getting the notices to check the linked notifications. We'll then apply a status to
  the notice on a priority basis.

  - If any notifications have a status of `ERROR`, show `ERROR`
  - Else if any notifications have a status of `PENDING,` show `PENDING`
  - Else show `SENT`

  We have a lot of notices, and updating the query to look at `water.scheduled_notification` is going to effect
  performance. So, to help with that we are adding an index on `event_id`.

  We've also recently done some work to
  [link notifications to licence gauging stations](https://github.com/DEFRA/water-abstraction-service/pull/2719). So, we
  are also taking the opportunity to add an index on `licence_gauging_station_id` to helps its performance.
*/

CREATE INDEX IF NOT EXISTS scheduled_notification_event_id_index ON water.scheduled_notification (event_id ASC);
CREATE INDEX IF NOT EXISTS scheduled_notification_licence_gauging_station_id_index ON water.scheduled_notification (licence_gauging_station_id ASC);
