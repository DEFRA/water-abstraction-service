/*
  https://eaflood.atlassian.net/browse/WATER-5424

  Add a link to the company that is the licence holder for this licence version.

  When the licence holder changes, it might result in a whole new licence. But
  at the very least a new version will be issued. This means we can be sure that
  whichever company we are linked to is the licence holder for this version of
  the licence.

  We started capturing licence holder information in a new
  `licence_version_holders` table, which is linked to each licence version. At
  the time the data in `crm_v2`, especially around `licence_document_roles` was
  considered a bit of a mess. So, we wanted to start somewhere new and clean.

  Because of the recent work to sort out CRM in the service, we've had more time
  with `crm_v2` and better understand it.

  The `crm_v2.companies` table is fine, and linking to it directly will give us
  the same result as what we are capturing in `water.licence_version_holders`.

  So, we are simplifying things by adding the column `company_id` to licence
  versions, and populating it based on existing data.

  A change to water-abstraction-import will ensure it is populated for new
  records.
*/

-- Add the new column
ALTER TABLE water.licence_versions ADD COLUMN company_id UUID;

-- Populate it with existing data
UPDATE water.licence_versions lv
SET company_id = lvh.company_id
FROM
  water.licence_version_holders lvh
WHERE
  lvh.licence_version_id = lv.licence_version_id;
