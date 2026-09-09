/*
  Prior to a fix being implemented. When the `date_deleted` was being set in the `licence_gauging_stations` table, the
  `date_updated` was not being updated at the same time.

  This migration will therefore set the `date_updated` to equal the `date_deleted` where `date_deleted` is present. As
  no further updates can be made to the data once the `date_deleted` has been set, we can be confident that the amended
  `date_updated` will be correct.
*/

UPDATE water.licence_gauging_stations
SET
  date_updated = date_deleted
WHERE
  date_deleted IS NOT NULL;
