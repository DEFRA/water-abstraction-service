/** Set as 'unknown' notifications with no status

  https://eaflood.atlassian.net/browse/WATER-5355

  We've found 8,125 water abstraction alert notifications that do not have a status. Nor do they have

  - A Notify status
  - A Notify ID
  - Any information in their `log` field

  We can only assume something went wrong during their creation that caused them to fail to record a notify ID, which
  then means the legacy service was unable to determine their Notify status.

  The issue is our new view notice and notification pages in
  [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system) assume _all_ notifications have a
  status. When trying to display these, we get a tiny blue square.

  We are still debating what to do with these notifications. In the meantime, we are going to set their status as
  'unknown' so we can easily identify them, and they display with _something_ in the UI.
 */

UPDATE water.scheduled_notification SET "status" = 'unknown' WHERE "status" IS NULL;
