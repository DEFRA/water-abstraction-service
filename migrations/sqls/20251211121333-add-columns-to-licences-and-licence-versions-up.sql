/*
  https://eaflood.atlassian.net/browse/WATER-5418 & https://eaflood.atlassian.net/browse/WATER-5419

  As part of the ‘view my licence 2.0’ changes, we need to start showing the issue date and application number stored in
  NALD. We therefore need to add the columns `issue_date` and `application_number` to the `water.licences` and
  `water.licence_versions` tables ready to accept the data imported from NALD.
*/

-- Add the new columns
ALTER TABLE water.licences ADD COLUMN application_number text DEFAULT NULL;
ALTER TABLE water.licences ADD COLUMN issue_date date DEFAULT NULL;

ALTER TABLE water.licence_versions ADD COLUMN application_number text DEFAULT NULL;
ALTER TABLE water.licence_versions ADD COLUMN issue_date date DEFAULT NULL;
